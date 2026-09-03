/**
 * Modul CBT - sisi guru: ringkasan, daftar ujian, bank soal, dan penilaian
 * esai.
 *
 * Berbeda dengan `exam-session.ts` yang dipakai saat ujian berlangsung,
 * bagian ini dipakai di luar jam ujian sehingga risikonya jauh lebih rendah.
 */

import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { calculateFinalScoreAfterManual } from "@/lib/exam-scoring";

const SUBMITTED = ["SUBMITTED", "AUTO_SUBMITTED"] as const;

/** Ambang nilai esai yang dianggap benar, mengikuti perilaku yang berjalan. */
const ESSAY_CORRECT_THRESHOLD = 60;

// ─── Ringkasan ──────────────────────────────────────────────────────────────

export async function getTeacherCounts(teacherId: string) {
  const [totalQuestions, totalExams, activeExams, closedExams, totalParticipants, pendingEssays] =
    await Promise.all([
      prisma.questionSet.count({ where: { ownerTeacherId: teacherId } }),
      prisma.exam.count({ where: { teacherId } }),
      prisma.exam.count({ where: { teacherId, status: "ACTIVE" } }),
      prisma.exam.count({ where: { teacherId, status: "CLOSED" } }),
      prisma.studentExamAttempt.count({ where: { exam: { teacherId } } }),
      prisma.studentAnswer.count({
        where: {
          question: { teacherId, questionType: "ESSAY" },
          score: null,
          attempt: { status: { in: [...SUBMITTED] } },
        },
      }),
    ]);

  return {
    totalQuestions,
    totalExams,
    activeExams,
    closedExams,
    totalParticipants,
    pendingEssays,
  };
}

/** Rata-rata nilai per kelas, dihitung dari attempt yang sudah bernilai. */
export async function getScoreByClass(teacherId: string) {
  const attempts = await prisma.studentExamAttempt.findMany({
    where: { exam: { teacherId }, score: { not: null } },
    include: {
      exam: { include: { subject: { select: { code: true } } } },
      student: { include: { class: { select: { name: true } } } },
    },
  });

  const perClass = new Map<string, { total: number; count: number }>();
  for (const attempt of attempts) {
    const className = attempt.student.class?.name ?? "-";
    const entry = perClass.get(className) ?? { total: 0, count: 0 };
    entry.total += attempt.score ?? 0;
    entry.count += 1;
    perClass.set(className, entry);
  }

  return [...perClass.entries()].map(([kelas, v]) => ({
    kelas,
    rata: Math.round(v.total / v.count),
  }));
}

export async function getRecentExams(teacherId: string, take = 5) {
  return prisma.exam.findMany({
    where: { teacherId },
    orderBy: { startAt: "desc" },
    take,
    include: {
      subject: { select: { code: true } },
      _count: { select: { attempts: true } },
    },
  });
}

// ─── Ujian & bank soal milik guru ───────────────────────────────────────────

export async function listTeacherExams(teacherId: string) {
  return prisma.exam.findMany({
    where: { teacherId },
    orderBy: { startAt: "desc" },
    include: {
      subject: { select: { code: true, name: true } },
      classes: { include: { class: { select: { name: true } } } },
      _count: { select: { questions: true, attempts: true } },
    },
  });
}

/**
 * Ujian guru yang sudah berjalan atau selesai, beserta nilai pesertanya -
 * dipakai halaman rekap nilai. Peserta diurutkan dari nilai tertinggi.
 */
export async function listExamResults(teacherId: string) {
  return prisma.exam.findMany({
    where: { teacherId, status: { in: ["CLOSED", "ACTIVE"] } },
    orderBy: { startAt: "desc" },
    include: {
      subject: { select: { code: true } },
      attempts: {
        where: { status: { in: [...SUBMITTED] } },
        include: {
          student: {
            include: { user: { select: { name: true } }, class: { select: { name: true } } },
          },
        },
        orderBy: { score: "desc" },
      },
    },
  });
}

export async function listTeacherQuestions(teacherId: string) {
  return prisma.question.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
    include: {
      subject: { select: { code: true, name: true } },
      options: { orderBy: { orderNumber: "asc" } },
      _count: { select: { examQuestions: true } },
    },
  });
}

// ─── Penilaian esai ─────────────────────────────────────────────────────────

/**
 * Jawaban esai pada attempt yang sudah dikumpulkan.
 *
 * Urutannya berbeda antar pemanggil dan sengaja dipertahankan: API mengurut
 * per waktu simpan jawaban, halaman web mengelompokkan per waktu pengumpulan
 * supaya guru menilai satu berkas sampai tuntas.
 */
export async function listEssayAnswers(
  teacherId: string,
  order: "SAVED_ASC" | "SUBMITTED_DESC" = "SAVED_ASC"
) {
  return prisma.studentAnswer.findMany({
    where: {
      question: { teacherId, questionType: "ESSAY" },
      attempt: { status: { in: [...SUBMITTED] } },
    },
    orderBy:
      order === "SAVED_ASC"
        ? { savedAt: "asc" }
        : [{ attempt: { submittedAt: "desc" } }, { savedAt: "asc" }],
    include: {
      question: {
        select: {
          id: true,
          questionText: true,
          scoreWeight: true,
          subject: { select: { code: true } },
        },
      },
      attempt: {
        include: {
          student: {
            include: { user: { select: { name: true } }, class: { select: { name: true } } },
          },
          exam: { select: { title: true, passingScore: true } },
        },
      },
    },
  });
}

export type GradeEssayResult = "OK" | "NOT_FOUND" | "FORBIDDEN";

/**
 * Simpan nilai satu jawaban esai, lalu hitung ulang nilai akhir attempt-nya.
 *
 * Nilai akhir tetap null selama masih ada jawaban manual yang belum dinilai -
 * lihat `calculateFinalScoreAfterManual`.
 */
export async function gradeEssay(input: {
  answerId: string;
  teacherId: string;
  score: number;
  auditAction?: string | null;
}): Promise<GradeEssayResult> {
  const answer = await prisma.studentAnswer.findUnique({
    where: { id: input.answerId },
    include: { question: true },
  });
  if (!answer) return "NOT_FOUND";
  if (answer.question.teacherId !== input.teacherId) return "FORBIDDEN";

  await prisma.studentAnswer.update({
    where: { id: input.answerId },
    data: { score: input.score, isCorrect: input.score >= ESSAY_CORRECT_THRESHOLD },
  });

  if (input.auditAction) {
    await logAudit({
      action: input.auditAction,
      entity: "studentAnswer",
      entityId: input.answerId,
      details: {
        attemptId: answer.attemptId,
        questionId: answer.questionId,
        score: input.score,
        teacherId: input.teacherId,
      },
    });
  }

  await recalculateAttemptScore(answer.attemptId);
  return "OK";
}

/** Hitung ulang nilai akhir attempt setelah ada jawaban manual yang dinilai. */
export async function recalculateAttemptScore(attemptId: string) {
  const attempt = await prisma.studentExamAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: { include: { question: { include: { options: true } } } },
      exam: {
        select: {
          multipleChoicePercentage: true,
          essayPercentage: true,
          questions: {
            include: { question: { select: { id: true, scoreWeight: true, questionType: true } } },
          },
        },
      },
    },
  });
  if (!attempt) return null;

  const finalScore = calculateFinalScoreAfterManual({
    questions: attempt.exam.questions.map((eq) => eq.question),
    answers: attempt.answers,
    multipleChoicePercentage: attempt.exam.multipleChoicePercentage,
    essayPercentage: attempt.exam.essayPercentage,
  });

  await prisma.studentExamAttempt.update({
    where: { id: attemptId },
    data: { score: finalScore },
  });

  return finalScore;
}
