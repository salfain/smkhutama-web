"use server";

import { prisma } from "@/lib/prisma";
import { requireCounselorAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function listSurveys() {
  await requireCounselorAuth();
  const rows = await prisma.survey.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true, responses: true } } },
  });
  return rows.map((s) => ({
    id: s.id, title: s.title, description: s.description ?? "", isActive: s.isActive,
    questionCount: s._count.questions, responseCount: s._count.responses,
  }));
}

export async function saveSurvey(fd: FormData) {
  await requireCounselorAuth();
  const id = String(fd.get("id") ?? "").trim();
  const title = String(fd.get("title") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  const isActive = fd.get("isActive") === "on";
  if (!title) return { error: "Judul angket wajib diisi" };
  const data = { title, description: description || null, isActive };
  if (id) await prisma.survey.update({ where: { id }, data });
  else await prisma.survey.create({ data });
  revalidatePath("/counselor/surveys");
  return { success: true };
}

export async function deleteSurvey(id: string) {
  await requireCounselorAuth();
  await prisma.survey.delete({ where: { id } });
  revalidatePath("/counselor/surveys");
  return { success: true };
}

export async function getSurveyDetail(id: string) {
  await requireCounselorAuth();
  const s = await prisma.survey.findUnique({
    where: { id },
    include: { questions: { orderBy: { orderNumber: "asc" } } },
  });
  if (!s) return null;
  return {
    id: s.id, title: s.title, description: s.description ?? "", isActive: s.isActive,
    questions: s.questions.map((q) => ({ id: q.id, text: q.text, category: q.category ?? "", orderNumber: q.orderNumber })),
  };
}

export async function saveQuestion(fd: FormData) {
  await requireCounselorAuth();
  const id = String(fd.get("id") ?? "").trim();
  const surveyId = String(fd.get("surveyId") ?? "").trim();
  const text = String(fd.get("text") ?? "").trim();
  const category = String(fd.get("category") ?? "").trim();
  if (!surveyId || !text) return { error: "Pertanyaan wajib diisi" };
  if (id) await prisma.surveyQuestion.update({ where: { id }, data: { text, category: category || null } });
  else {
    const count = await prisma.surveyQuestion.count({ where: { surveyId } });
    await prisma.surveyQuestion.create({ data: { surveyId, text, category: category || null, orderNumber: count } });
  }
  revalidatePath(`/counselor/surveys/${surveyId}`);
  return { success: true };
}

export async function deleteQuestion(id: string, surveyId: string) {
  await requireCounselorAuth();
  await prisma.surveyQuestion.delete({ where: { id } });
  revalidatePath(`/counselor/surveys/${surveyId}`);
  return { success: true };
}

export async function getSurveyResults(id: string) {
  await requireCounselorAuth();
  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { orderNumber: "asc" } },
      responses: {
        include: {
          student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } },
          answers: true,
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
  if (!survey) return null;

  // rata-rata nilai per pertanyaan (skala 1-4)
  const perQuestion = survey.questions.map((q) => {
    let sum = 0, n = 0;
    for (const r of survey.responses) {
      const a = r.answers.find((x) => x.questionId === q.id);
      if (a) { sum += a.value; n++; }
    }
    return { id: q.id, text: q.text, category: q.category ?? "", avg: n ? +(sum / n).toFixed(2) : 0, count: n };
  });
  // pertanyaan dengan kebutuhan tertinggi (avg tertinggi)
  const priorities = [...perQuestion].sort((a, b) => b.avg - a.avg).slice(0, 5);

  return {
    id: survey.id, title: survey.title,
    responseCount: survey.responses.length,
    perQuestion, priorities,
    responses: survey.responses.map((r) => ({
      id: r.id, studentName: r.student.user.name, className: r.student.class?.name ?? "-", submittedAt: r.submittedAt,
    })),
  };
}
