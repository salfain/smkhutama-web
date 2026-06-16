"use server";

import { prisma } from "@/lib/prisma";
import { requireCounselorAuth } from "@/lib/session";
import { generateExcel } from "@/lib/excel";
import { recommendedLevel } from "@/lib/bk-points";

// ============= LAPORAN & REKAP =============
export async function getReportData() {
  await requireCounselorAuth();

  const [totalCases, totalViolations, totalAchievements, totalRequests, totalHomeVisits] = await Promise.all([
    prisma.counselingCase.count(),
    prisma.violationRecord.count(),
    prisma.achievementRecord.count(),
    prisma.counselingRequest.count(),
    prisma.homeVisit.count(),
  ]);

  // Rekap per kelas (poin pelanggaran)
  const classes = await prisma.class.findMany({
    include: {
      students: {
        include: {
          violationRecords: { select: { points: true } },
          achievementRecords: { select: { points: true } },
          counselingCases: { select: { id: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
  const perClass = classes.map((c) => {
    let vPoints = 0, aPoints = 0, cases = 0, violations = 0;
    for (const s of c.students) {
      vPoints += s.violationRecords.reduce((sum, v) => sum + v.points, 0);
      violations += s.violationRecords.length;
      aPoints += s.achievementRecords.reduce((sum, a) => sum + a.points, 0);
      cases += s.counselingCases.length;
    }
    return { className: c.name, students: c.students.length, violations, violationPoints: vPoints, achievementPoints: aPoints, cases };
  }).filter((c) => c.students > 0);

  // Tren pelanggaran 6 bulan terakhir
  const now = new Date();
  const months: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const count = await prisma.violationRecord.count({ where: { date: { gte: start, lt: end } } });
    months.push({ label: start.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }), count });
  }

  // Konseling per jenis
  const byType = await prisma.counselingCase.groupBy({ by: ["type"], _count: { _all: true } });
  const typeData = byType.map((t) => ({ type: t.type, count: t._count._all }));

  return { totalCases, totalViolations, totalAchievements, totalRequests, totalHomeVisits, perClass, months, typeData };
}

export async function exportReportExcel() {
  await requireCounselorAuth();
  const data = await getReportData();
  const rows = data.perClass.map((c, i) => ({
    no: i + 1,
    kelas: c.className,
    siswa: c.students,
    jumlahPelanggaran: c.violations,
    poinPelanggaran: c.violationPoints,
    poinPrestasi: c.achievementPoints,
    konseling: c.cases,
  }));
  const buf = await generateExcel("Rekap BK per Kelas", [
    { header: "No", key: "no", width: 5 },
    { header: "Kelas", key: "kelas", width: 18 },
    { header: "Jml Siswa", key: "siswa", width: 10 },
    { header: "Jml Pelanggaran", key: "jumlahPelanggaran", width: 16 },
    { header: "Poin Pelanggaran", key: "poinPelanggaran", width: 16 },
    { header: "Poin Prestasi", key: "poinPrestasi", width: 14 },
    { header: "Sesi Konseling", key: "konseling", width: 14 },
  ], rows);
  return { data: Array.from(buf), filename: "rekap-bk-per-kelas.xlsx" };
}

// ============= TINDAK LANJUT (SP) =============
export async function getFollowUpData() {
  await requireCounselorAuth();
  const students = await prisma.student.findMany({
    include: {
      user: { select: { name: true } },
      class: { select: { name: true } },
      violationRecords: { select: { points: true } },
      parentSummons: { orderBy: { createdAt: "desc" } },
    },
  });

  const list = students
    .map((s) => {
      const points = s.violationRecords.reduce((sum, v) => sum + v.points, 0);
      const rec = recommendedLevel(points);
      const lastSummon = s.parentSummons[0] ?? null;
      return {
        studentId: s.id, name: s.user.name, className: s.class?.name ?? "-",
        points, recommended: rec, lastSummonLevel: lastSummon?.level ?? null,
      };
    })
    .filter((s) => s.points > 0)
    .sort((a, b) => b.points - a.points);

  return list;
}

export async function createSummon(fd: FormData) {
  await requireCounselorAuth();
  const user = await requireCounselorAuth();
  const counselor = await prisma.counselor.upsert({
    where: { userId: user.id }, update: {}, create: { userId: user.id },
  });
  const studentId = String(fd.get("studentId") ?? "").trim();
  const level = String(fd.get("level") ?? "").trim();
  const reason = String(fd.get("reason") ?? "").trim();
  const totalPoints = parseInt(String(fd.get("totalPoints") ?? "0"), 10) || 0;
  const meetingDate = String(fd.get("meetingDate") ?? "").trim();
  if (!studentId || !level || !reason) return { error: "Data tidak lengkap" };
  await prisma.parentSummon.create({
    data: {
      studentId, counselorId: counselor.id, level, reason, totalPoints,
      meetingDate: meetingDate ? new Date(meetingDate) : null, status: "PENDING",
    },
  });
  return { success: true };
}

export async function listSummons() {
  await requireCounselorAuth();
  const rows = await prisma.parentSummon.findMany({
    orderBy: { createdAt: "desc" },
    include: { student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } } },
  });
  return rows.map((r) => ({
    id: r.id, studentName: r.student.user.name, className: r.student.class?.name ?? "-",
    studentPhone: "", level: r.level, reason: r.reason, totalPoints: r.totalPoints,
    meetingDate: r.meetingDate, status: r.status, createdAt: r.createdAt,
  }));
}

export async function updateSummonStatus(id: string, status: "PENDING" | "SENT" | "DONE") {
  await requireCounselorAuth();
  await prisma.parentSummon.update({ where: { id }, data: { status } });
  return { success: true };
}

export async function deleteSummon(id: string) {
  await requireCounselorAuth();
  await prisma.parentSummon.delete({ where: { id } });
  return { success: true };
}

export async function getSummonDetail(id: string) {
  await requireCounselorAuth();
  const s = await prisma.parentSummon.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          user: { select: { name: true } },
          class: { select: { name: true } },
        },
      },
      counselor: { include: { user: { select: { name: true } } } },
    },
  });
  if (!s) return null;
  return {
    id: s.id, level: s.level, reason: s.reason, totalPoints: s.totalPoints,
    meetingDate: s.meetingDate, createdAt: s.createdAt,
    studentName: s.student.user.name, studentNis: s.student.nis ?? "",
    className: s.student.class?.name ?? "-", counselorName: s.counselor.user.name,
  };
}
