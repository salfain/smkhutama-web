"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";

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

    // Recompute total score for this attempt
    const allAnswers = await prisma.studentAnswer.findMany({
      where: { attemptId: answer.attemptId },
      include: { question: { select: { scoreWeight: true } } },
    });

    const allScored = allAnswers.every((a) => a.score !== null);
    if (allScored) {
      // Compute weighted score: sum(score * weight) / sum(weight) -> normalize 0-100
      const totalWeight = allAnswers.reduce((s, a) => s + (a.question.scoreWeight ?? 1), 0);
      const totalScore = allAnswers.reduce((s, a) => s + ((a.score ?? 0) * (a.question.scoreWeight ?? 1)), 0);
      const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
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
