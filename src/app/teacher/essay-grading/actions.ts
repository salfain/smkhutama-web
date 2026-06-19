"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { calculateFinalScoreAfterManual } from "@/lib/exam-scoring";

export async function getPendingEssays() {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return [];

  return prisma.studentAnswer.findMany({
    where: {
      question: { teacherId: user.teacher.id, questionType: "ESSAY" },
      attempt: { status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
    },
    orderBy: [{ attempt: { submittedAt: "desc" } }, { savedAt: "asc" }],
    include: {
      question: {
        select: {
          id: true, questionText: true, scoreWeight: true,
          subject: { select: { code: true } },
        },
      },
      attempt: {
        include: {
          student: {
            include: {
              user: { select: { name: true } },
              class: { select: { name: true } },
            },
          },
          exam: { select: { title: true, passingScore: true } },
        },
      },
    },
  });
}

export async function gradeEssay(answerId: string, formData: FormData) {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return { error: "Tidak diizinkan" };

  const score = Number(formData.get("score") ?? "");
  if (isNaN(score) || score < 0 || score > 100) {
    return { error: "Nilai harus 0–100" };
  }

  try {
    const answer = await prisma.studentAnswer.findUnique({
      where: { id: answerId },
      include: { question: true },
    });
    if (!answer) return { error: "Jawaban tidak ditemukan" };
    if (answer.question.teacherId !== user.teacher.id) return { error: "Tidak diizinkan" };

    await prisma.studentAnswer.update({
      where: { id: answerId },
      data: { score, isCorrect: score >= 60 },
    });
    await logAudit({
      action: "GRADE_ESSAY",
      entity: "studentAnswer",
      entityId: answerId,
      details: {
        attemptId: answer.attemptId,
        questionId: answer.questionId,
        score,
        teacherId: user.teacher.id,
      },
    });

    const attempt = await prisma.studentExamAttempt.findUnique({
      where: { id: answer.attemptId },
      include: {
        answers: {
          include: { question: { include: { options: true } } },
        },
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

    if (attempt) {
      const finalScore = calculateFinalScoreAfterManual({
        questions: attempt.exam.questions.map((eq) => eq.question),
        answers: attempt.answers,
        multipleChoicePercentage: attempt.exam.multipleChoicePercentage,
        essayPercentage: attempt.exam.essayPercentage,
      });
      await prisma.studentExamAttempt.update({
        where: { id: answer.attemptId },
        data: { score: finalScore },
      });
    }

    revalidatePath("/teacher/essay-grading");
    return { success: true };
  } catch {
    return { error: "Gagal menyimpan nilai" };
  }
}
