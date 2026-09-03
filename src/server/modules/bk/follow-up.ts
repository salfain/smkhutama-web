/**
 * Modul BK - tindak lanjut: kunjungan rumah, pemanggilan orang tua, agenda,
 * dan rekap laporan.
 *
 * Ambang poin → rekomendasi SP tetap di `src/lib/bk-points.ts` karena aturan
 * itu dipakai juga oleh komponen client (`FollowUpClient.tsx`), sementara
 * folder `src/server/` khusus kode yang hanya jalan di server.
 */

import { prisma } from "@/lib/prisma";
import { requireCurrentAcademicYearId } from "@/lib/academic-year";
import { recommendedLevel } from "@/lib/bk-points";

export type SummonStatus = "PENDING" | "SENT" | "DONE";

const STUDENT_WITH_CLASS = {
  user: { select: { name: true } },
  class: { select: { name: true } },
} as const;

// ─── Kunjungan rumah ────────────────────────────────────────────────────────

export async function listHomeVisits() {
  return prisma.homeVisit.findMany({
    orderBy: { visitDate: "desc" },
    include: { student: { include: STUDENT_WITH_CLASS } },
  });
}

export async function getHomeVisit(id: string) {
  return prisma.homeVisit.findUnique({
    where: { id },
    include: {
      student: { include: { ...STUDENT_WITH_CLASS, major: { select: { name: true } } } },
      counselor: { include: { user: { select: { name: true } } } },
    },
  });
}

export type SaveHomeVisitInput = {
  id?: string | null;
  studentId: string;
  counselorId: string;
  visitDate?: string | Date | null;
  purpose: string;
  address?: string | null;
  findings?: string | null;
  result?: string | null;
};

export async function saveHomeVisit(input: SaveHomeVisitInput) {
  const data = {
    visitDate: input.visitDate ? new Date(input.visitDate) : new Date(),
    purpose: input.purpose,
    address: input.address || null,
    findings: input.findings || null,
    result: input.result || null,
  };

  if (input.id) return prisma.homeVisit.update({ where: { id: input.id }, data });
  const academicYearId = await requireCurrentAcademicYearId();
  return prisma.homeVisit.create({
    data: { ...data, studentId: input.studentId, counselorId: input.counselorId, academicYearId },
  });
}

export async function deleteHomeVisit(id: string) {
  const result = await prisma.homeVisit.deleteMany({ where: { id } });
  return result.count > 0;
}

// ─── Pemanggilan orang tua ──────────────────────────────────────────────────

export async function listSummons() {
  return prisma.parentSummon.findMany({
    orderBy: { createdAt: "desc" },
    include: { student: { include: STUDENT_WITH_CLASS } },
  });
}

export async function getSummon(id: string) {
  return prisma.parentSummon.findUnique({
    where: { id },
    include: {
      student: { include: { ...STUDENT_WITH_CLASS, major: { select: { name: true } } } },
      counselor: { include: { user: { select: { name: true } } } },
    },
  });
}

export type CreateSummonInput = {
  studentId: string;
  counselorId: string;
  level: string;
  reason: string;
  totalPoints: number;
  meetingDate?: string | null;
};

export async function createSummon(input: CreateSummonInput) {
  const academicYearId = await requireCurrentAcademicYearId();
  return prisma.parentSummon.create({
    data: {
      studentId: input.studentId,
      academicYearId,
      counselorId: input.counselorId,
      level: input.level,
      reason: input.reason,
      totalPoints: input.totalPoints,
      meetingDate: input.meetingDate ? new Date(input.meetingDate) : null,
      status: "PENDING",
    },
  });
}

export async function updateSummonStatus(id: string, status: SummonStatus) {
  const result = await prisma.parentSummon.updateMany({ where: { id }, data: { status } });
  return result.count > 0;
}

export async function deleteSummon(id: string) {
  const result = await prisma.parentSummon.deleteMany({ where: { id } });
  return result.count > 0;
}

// ─── Agenda ─────────────────────────────────────────────────────────────────

/** Tindak lanjut kasus, permohonan, dan pemanggilan mulai hari ini, urut waktu. */
export async function getAgenda() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [cases, requests, summons] = await Promise.all([
    prisma.counselingCase.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS", "REFERRED"] }, nextFollowUpAt: { gte: start } },
      orderBy: { nextFollowUpAt: "asc" },
      include: { student: { include: STUDENT_WITH_CLASS } },
    }),
    prisma.counselingRequest.findMany({
      where: { status: { in: ["APPROVED", "SCHEDULED"] }, preferredDate: { gte: start } },
      orderBy: { preferredDate: "asc" },
      include: { student: { include: STUDENT_WITH_CLASS } },
    }),
    prisma.parentSummon.findMany({
      where: { meetingDate: { gte: start }, status: { in: ["PENDING", "SENT"] } },
      orderBy: { meetingDate: "asc" },
      include: { student: { include: STUDENT_WITH_CLASS } },
    }),
  ]);

  const items = [
    ...cases.filter((c) => c.nextFollowUpAt).map((c) => ({
      id: c.id,
      kind: "Konseling",
      title: c.title,
      date: c.nextFollowUpAt as Date,
      studentName: c.student.user.name,
      className: c.student.class?.name ?? "-",
    })),
    ...requests
      .filter((r) => r.preferredDate)
      .map((r) => ({
        id: r.id,
        kind: "Permohonan",
        title: r.topic,
        date: r.preferredDate as Date,
        studentName: r.student.user.name,
        className: r.student.class?.name ?? "-",
      })),
    ...summons
      .filter((s) => s.meetingDate)
      .map((s) => ({
        id: s.id,
        kind: "Pemanggilan",
        title: `${s.level} - ${s.reason}`,
        date: s.meetingDate as Date,
        studentName: s.student.user.name,
        className: s.student.class?.name ?? "-",
      })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return items;
}

// ─── Rekap laporan ──────────────────────────────────────────────────────────

/** Rekap BK: total, per kelas, tren 6 bulan, dan sebaran jenis konseling. */
export async function getReportData() {
  const [totalCases, totalViolations, totalAchievements, totalRequests, totalHomeVisits] =
    await Promise.all([
      prisma.counselingCase.count(),
      prisma.violationRecord.count(),
      prisma.achievementRecord.count(),
      prisma.counselingRequest.count(),
      prisma.homeVisit.count(),
    ]);

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

  const perClass = classes
    .map((cls) => {
      let violationPoints = 0;
      let achievementPoints = 0;
      let cases = 0;
      let violations = 0;

      for (const student of cls.students) {
        violationPoints += student.violationRecords.reduce((sum, v) => sum + v.points, 0);
        violations += student.violationRecords.length;
        achievementPoints += student.achievementRecords.reduce((sum, a) => sum + a.points, 0);
        cases += student.counselingCases.length;
      }

      return {
        className: cls.name,
        students: cls.students.length,
        violations,
        violationPoints,
        achievementPoints,
        cases,
      };
    })
    .filter((cls) => cls.students > 0);

  // Tren pelanggaran 6 bulan terakhir, dihitung sekaligus alih-alih berurutan.
  const now = new Date();
  const monthRanges = Array.from({ length: 6 }, (_, index) => {
    const offset = 5 - index;
    return {
      start: new Date(now.getFullYear(), now.getMonth() - offset, 1),
      end: new Date(now.getFullYear(), now.getMonth() - offset + 1, 1),
    };
  });
  const monthCounts = await Promise.all(
    monthRanges.map((range) =>
      prisma.violationRecord.count({ where: { date: { gte: range.start, lt: range.end } } })
    )
  );
  const months = monthRanges.map((range, index) => ({
    label: range.start.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
    count: monthCounts[index],
  }));

  const byType = await prisma.counselingCase.groupBy({ by: ["type"], _count: { _all: true } });
  const typeData = byType.map((row) => ({ type: row.type, count: row._count._all }));

  return {
    totalCases,
    totalViolations,
    totalAchievements,
    totalRequests,
    totalHomeVisits,
    perClass,
    months,
    typeData,
  };
}

/**
 * Daftar siswa berpoin pelanggaran beserta rekomendasi tindak lanjut (SP),
 * urut dari poin terbesar.
 */
export async function getFollowUpData() {
  const students = await prisma.student.findMany({
    include: {
      user: { select: { name: true } },
      class: { select: { name: true } },
      violationRecords: { select: { points: true } },
      parentSummons: { orderBy: { createdAt: "desc" } },
    },
  });

  return students
    .map((student) => {
      const points = student.violationRecords.reduce((sum, v) => sum + v.points, 0);
      return {
        studentId: student.id,
        name: student.user.name,
        className: student.class?.name ?? "-",
        points,
        recommended: recommendedLevel(points),
        lastSummonLevel: student.parentSummons[0]?.level ?? null,
      };
    })
    .filter((student) => student.points > 0)
    .sort((a, b) => b.points - a.points);
}
