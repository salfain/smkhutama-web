"use server";

import { prisma } from "@/lib/prisma";
import { generateExcel } from "@/lib/excel";

export async function getReportSummary() {
  const [
    totalExams, activeExams, closedExams,
    totalStudents, totalTeachers, totalClasses, totalSubjects, totalQuestions,
  ] = await Promise.all([
    prisma.exam.count(),
    prisma.exam.count({ where: { status: "ACTIVE" } }),
    prisma.exam.count({ where: { status: "CLOSED" } }),
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.class.count(),
    prisma.subject.count(),
    prisma.question.count(),
  ]);

  const recentClosed = await prisma.exam.findMany({
    where: { status: "CLOSED" },
    orderBy: { endAt: "desc" },
    take: 10,
    include: {
      subject: { select: { code: true, name: true } },
      teacher: { include: { user: { select: { name: true } } } },
      classes: { include: { class: { select: { name: true } } } },
      _count: { select: { attempts: true } },
    },
  });

  return {
    totalExams, activeExams, closedExams,
    totalStudents, totalTeachers, totalClasses, totalSubjects, totalQuestions,
    recentClosed,
  };
}

// ---- Export rekap nilai per ujian ----
export async function exportExamScores(examId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      subject: { select: { code: true, name: true } },
      teacher: { include: { user: { select: { name: true } } } },
    },
  });
  if (!exam) return { error: "Ujian tidak ditemukan" };

  const attempts = await prisma.studentExamAttempt.findMany({
    where: { examId },
    orderBy: { score: "desc" },
    include: {
      student: {
        include: {
          user: { select: { name: true } },
          class: { select: { name: true } },
        },
      },
    },
  });

  const rows = attempts.map((a, i) => ({
    no: i + 1,
    nama: a.student.user.name,
    nis: a.student.nis ?? "",
    kelas: a.student.class?.name ?? "",
    nilai: a.score ?? "-",
    status: a.status,
    waktu_mulai: a.startedAt ? new Date(a.startedAt).toLocaleString("id-ID") : "-",
    waktu_selesai: a.submittedAt ? new Date(a.submittedAt).toLocaleString("id-ID") : "-",
    keterangan: exam.passingScore && a.score !== null
      ? (a.score >= exam.passingScore ? "Lulus" : "Tidak Lulus")
      : "-",
  }));

  const buf = await generateExcel(`Nilai ${exam.subject.code}`, [
    { header: "No", key: "no", width: 5 },
    { header: "Nama Siswa", key: "nama", width: 28 },
    { header: "NIS", key: "nis", width: 14 },
    { header: "Kelas", key: "kelas", width: 14 },
    { header: "Nilai", key: "nilai", width: 10 },
    { header: "Status", key: "status", width: 16 },
    { header: "Waktu Mulai", key: "waktu_mulai", width: 22 },
    { header: "Waktu Selesai", key: "waktu_selesai", width: 22 },
    { header: "Keterangan", key: "keterangan", width: 14 },
  ], rows);

  return { data: Array.from(buf), filename: `nilai-${exam.subject.code}-${exam.id.slice(0,6)}.xlsx` };
}

// ---- Export daftar hadir ujian ----
export async function exportAttendance(examId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      subject: { select: { code: true } },
      classes: {
        include: { class: { select: { id: true, name: true } } },
      },
    },
  });
  if (!exam) return { error: "Ujian tidak ditemukan" };

  const classIds = exam.classes.map((c) => c.class.id);
  const students = await prisma.student.findMany({
    where: classIds.length > 0 ? { classId: { in: classIds } } : {},
    orderBy: { user: { name: "asc" } },
    include: {
      user: { select: { name: true } },
      class: { select: { name: true } },
      attempts: { where: { examId }, take: 1 },
    },
  });

  const rows = students.map((s, i) => ({
    no: i + 1,
    nama: s.user.name,
    nis: s.nis ?? "",
    kelas: s.class?.name ?? "",
    hadir: s.attempts[0]?.startedAt ? "✓ Hadir" : "Tidak Hadir",
    waktu: s.attempts[0]?.startedAt ? new Date(s.attempts[0].startedAt).toLocaleString("id-ID") : "—",
    tanda_tangan: "",
  }));

  const buf = await generateExcel(`Hadir ${exam.subject.code}`, [
    { header: "No", key: "no", width: 5 },
    { header: "Nama Siswa", key: "nama", width: 28 },
    { header: "NIS", key: "nis", width: 14 },
    { header: "Kelas", key: "kelas", width: 14 },
    { header: "Kehadiran", key: "hadir", width: 14 },
    { header: "Waktu Login", key: "waktu", width: 22 },
    { header: "Tanda Tangan", key: "tanda_tangan", width: 22 },
  ], rows);

  return { data: Array.from(buf), filename: `hadir-${exam.subject.code}-${exam.id.slice(0,6)}.xlsx` };
}

// ---- Export rekap per kelas (semua mapel) ----
export async function exportClassRecap() {
  const classes = await prisma.class.findMany({
    orderBy: [{ grade: "asc" }, { name: "asc" }],
    include: {
      students: {
        include: {
          user: { select: { name: true } },
          attempts: {
            where: { score: { not: null } },
            include: { exam: { include: { subject: { select: { code: true } } } } },
          },
        },
      },
    },
  });

  const rows: Record<string, string | number>[] = [];
  let no = 1;
  for (const cls of classes) {
    for (const s of cls.students) {
      const total = s.attempts.length;
      const avg = total > 0
        ? Math.round(s.attempts.reduce((sum, a) => sum + (a.score ?? 0), 0) / total)
        : 0;
      rows.push({
        no: no++,
        kelas: cls.name,
        nama: s.user.name,
        nis: s.nis ?? "",
        total_ujian: total,
        rata_rata: avg,
      });
    }
  }

  const buf = await generateExcel("Rekap Kelas", [
    { header: "No", key: "no", width: 5 },
    { header: "Kelas", key: "kelas", width: 16 },
    { header: "Nama Siswa", key: "nama", width: 28 },
    { header: "NIS", key: "nis", width: 14 },
    { header: "Total Ujian", key: "total_ujian", width: 12 },
    { header: "Rata-rata Nilai", key: "rata_rata", width: 14 },
  ], rows);

  return { data: Array.from(buf), filename: "rekap-nilai-per-kelas.xlsx" };
}
