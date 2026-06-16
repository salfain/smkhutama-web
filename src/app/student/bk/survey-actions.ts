"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function listAvailableSurveys() {
  const user = await requireAuth("STUDENT");
  if (!user.student) return [];
  const surveys = await prisma.survey.findMany({
    where: { isActive: true },
    include: { _count: { select: { questions: true } }, responses: { where: { studentId: user.student.id }, select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });
  return surveys
    .filter((s) => s._count.questions > 0)
    .map((s) => ({
      id: s.id, title: s.title, description: s.description ?? "",
      questionCount: s._count.questions, answered: s.responses.length > 0,
    }));
}

export async function getSurveyForFill(id: string) {
  const user = await requireAuth("STUDENT");
  if (!user.student) return null;
  const survey = await prisma.survey.findUnique({
    where: { id },
    include: { questions: { orderBy: { orderNumber: "asc" } } },
  });
  if (!survey || !survey.isActive) return null;
  const already = await prisma.surveyResponse.findUnique({
    where: { surveyId_studentId: { surveyId: id, studentId: user.student.id } },
  });
  return {
    id: survey.id, title: survey.title, description: survey.description ?? "",
    answered: !!already,
    questions: survey.questions.map((q) => ({ id: q.id, text: q.text, category: q.category ?? "" })),
  };
}

export async function submitSurvey(fd: FormData) {
  const user = await requireAuth("STUDENT");
  if (!user.student) return { error: "Data siswa tidak ditemukan" };
  const surveyId = String(fd.get("surveyId") ?? "").trim();
  if (!surveyId) return { error: "Angket tidak valid" };

  const existing = await prisma.surveyResponse.findUnique({
    where: { surveyId_studentId: { surveyId, studentId: user.student.id } },
  });
  if (existing) return { error: "Anda sudah mengisi angket ini." };

  const questions = await prisma.surveyQuestion.findMany({ where: { surveyId }, select: { id: true } });
  const answers = questions.map((q) => {
    const v = parseInt(String(fd.get(`q_${q.id}`) ?? "0"), 10);
    return { questionId: q.id, value: isNaN(v) ? 0 : v };
  });

  try {
    await prisma.surveyResponse.create({
      data: {
        surveyId, studentId: user.student.id,
        answers: { create: answers },
      },
    });
    revalidatePath("/student/bk");
    return { success: true };
  } catch {
    return { error: "Gagal menyimpan jawaban." };
  }
}
