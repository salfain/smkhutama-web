/**
 * Modul CBT - daftar ujian, dashboard, dan hasil untuk siswa.
 * Bagian yang dibaca di luar sesi ujian; siklus ujiannya ada di
 * `exam-session.ts`.
 */

import { prisma } from "@/lib/prisma";

/** Filter kelas: siswa tanpa kelas melihat seluruh ujian, seperti sebelumnya. */
function classFilter(classId: string | null) {
  return classId ? { classes: { some: { classId } } } : {};
}

/** Semua ujian untuk kelas siswa, beserta attempt miliknya bila sudah ada. */
export async function listExams(student: { id: string; classId: string | null }) {
  return prisma.exam.findMany({
    where: classFilter(student.classId),
    orderBy: { startAt: "desc" },
    include: {
      subject: { select: { code: true, name: true } },
      _count: { select: { questions: true } },
      attempts: { where: { studentId: student.id }, take: 1 },
    },
  });
}

/**
 * Ringkasan beranda siswa: ujian hari ini, ujian mendatang, dan lima hasil
 * terakhir. Batas "hari ini" mengikuti waktu lokal proses - lihat catatan
 * timezone di docs/api-v1-plan.md.
 */
export async function getDashboard(student: { id: string; classId: string | null }) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const forClass = classFilter(student.classId);

  const [todayExams, upcomingExams, history] = await Promise.all([
    prisma.exam.findMany({
      where: { status: "ACTIVE", startAt: { lte: todayEnd }, endAt: { gte: now }, ...forClass },
      orderBy: { startAt: "asc" },
      include: {
        subject: { select: { code: true, name: true } },
        _count: { select: { questions: true } },
      },
    }),
    prisma.exam.findMany({
      where: { status: { in: ["ACTIVE", "DRAFT"] }, startAt: { gt: todayEnd }, ...forClass },
      orderBy: { startAt: "asc" },
      take: 5,
      include: { subject: { select: { code: true, name: true } } },
    }),
    prisma.studentExamAttempt.findMany({
      where: { studentId: student.id, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
      orderBy: { submittedAt: "desc" },
      take: 5,
      include: { exam: { include: { subject: { select: { code: true } } } } },
    }),
  ]);

  return { todayExams, upcomingExams, history };
}

/**
 * Ringkasan satu attempt untuk halaman selesai ujian: jumlah benar, salah,
 * dan kosong. "Kosong" dihitung dari total soal dikurangi jawaban yang benar-
 * benar terisi, bukan dari jumlah baris jawaban - soal yang dibuka lalu
 * ditinggalkan tetap punya baris jawaban kosong.
 */
export async function getFinishSummary(examId: string, studentId: string) {
  const attempt = await prisma.studentExamAttempt.findUnique({
    where: { examId_studentId: { examId, studentId } },
    include: {
      exam: { include: { subject: { select: { code: true, name: true } } } },
      answers: { select: { isCorrect: true, selectedOptionId: true, answerText: true } },
    },
  });
  if (!attempt) return null;

  const totalQuestions = await prisma.examQuestion.count({ where: { examId } });
  const filled = attempt.answers.filter((a) => a.selectedOptionId || a.answerText).length;

  return {
    attempt,
    totalQuestions,
    correct: attempt.answers.filter((a) => a.isCorrect === true).length,
    wrong: attempt.answers.filter((a) => a.isCorrect === false).length,
    empty: totalQuestions - filled,
  };
}

/** Hasil ujian yang sudah dikirim, terbaru dulu. */
export async function listResults(studentId: string) {
  return prisma.studentExamAttempt.findMany({
    where: { studentId, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
    orderBy: { submittedAt: "desc" },
    include: {
      exam: { include: { subject: { select: { code: true, name: true } } } },
      answers: { select: { isCorrect: true } },
    },
  });
}
