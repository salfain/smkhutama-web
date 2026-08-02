/**
 * Modul CBT — analisis butir soal.
 *
 * Menghitung tingkat kesukaran tiap soal dari jawaban peserta, dipakai
 * halaman analisis guru. Rumusnya sengaja ditaruh di sini, bukan di halaman,
 * supaya bisa diuji dan dipakai ulang tanpa merender apa pun.
 */

import { prisma } from "@/lib/prisma";

const SUBMITTED = ["SUBMITTED", "AUTO_SUBMITTED"] as const;

/** Ujian guru yang sudah ditutup — hanya ini yang layak dianalisis. */
export async function listClosedExams(teacherId: string) {
  return prisma.exam.findMany({
    where: { teacherId, status: "CLOSED" },
    orderBy: { endAt: "desc" },
    include: {
      subject: { select: { code: true, name: true } },
      _count: { select: { attempts: true } },
    },
  });
}

export type QuestionStat = {
  no: number;
  questionText: string;
  questionType: string;
  correct: number;
  wrong: number;
  total: number;
  /** Proporsi peserta yang menjawab benar, 0–1. Makin kecil, makin sulit. */
  difficulty: number;
};

/**
 * Statistik per soal untuk satu ujian.
 *
 * Pembagi tingkat kesukaran adalah **jumlah peserta**, bukan jumlah jawaban
 * yang masuk — soal yang banyak dikosongkan memang seharusnya terhitung sulit.
 */
export async function getQuestionAnalysis(examId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      subject: { select: { code: true, name: true } },
      questions: {
        orderBy: { orderNumber: "asc" },
        include: { question: { select: { id: true, questionText: true, questionType: true } } },
      },
      _count: { select: { attempts: true } },
    },
  });
  if (!exam) return null;

  const questionIds = exam.questions.map((q) => q.questionId);
  const answers = await prisma.studentAnswer.findMany({
    where: {
      questionId: { in: questionIds },
      attempt: { examId, status: { in: [...SUBMITTED] } },
    },
    select: { questionId: true, isCorrect: true },
  });

  const totalParticipants = exam._count.attempts;
  const divisor = totalParticipants || 1;

  const stats: QuestionStat[] = exam.questions.map((examQuestion, index) => {
    const forQuestion = answers.filter((a) => a.questionId === examQuestion.questionId);
    const correct = forQuestion.filter((a) => a.isCorrect === true).length;
    const wrong = forQuestion.filter((a) => a.isCorrect === false).length;

    return {
      no: index + 1,
      questionText: examQuestion.question.questionText,
      questionType: examQuestion.question.questionType,
      correct,
      wrong,
      total: totalParticipants,
      difficulty: correct / divisor,
    };
  });

  const byDifficulty = [...stats].sort((a, b) => a.difficulty - b.difficulty);
  const averageDifficulty =
    stats.length > 0 ? stats.reduce((sum, s) => sum + s.difficulty, 0) / stats.length : 0;

  return {
    exam,
    totalParticipants,
    stats,
    hardest: byDifficulty[0],
    easiest: byDifficulty[byDifficulty.length - 1],
    averageDifficulty,
  };
}
