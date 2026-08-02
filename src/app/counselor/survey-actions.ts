"use server";

/**
 * Server action halaman angket guru BK.
 * Query-nya dipinjam dari `@/server/modules/bk/surveys`.
 */

import { revalidatePath } from "next/cache";
import { requireCounselorAuth } from "@/lib/session";
import * as surveys from "@/server/modules/bk/surveys";

const SURVEYS_PATH = "/counselor/surveys";

function text(fd: FormData, field: string) {
  return String(fd.get(field) ?? "").trim();
}

export async function listSurveys() {
  await requireCounselorAuth();
  const rows = await surveys.listSurveys();
  return rows.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description ?? "",
    isActive: s.isActive,
    questionCount: s._count.questions,
    responseCount: s._count.responses,
  }));
}

export async function saveSurvey(fd: FormData) {
  await requireCounselorAuth();
  const title = text(fd, "title");
  if (!title) return { error: "Judul angket wajib diisi" };

  await surveys.saveSurvey({
    id: text(fd, "id"),
    title,
    description: text(fd, "description"),
    isActive: fd.get("isActive") === "on",
  });

  revalidatePath(SURVEYS_PATH);
  return { success: true };
}

export async function deleteSurvey(id: string) {
  await requireCounselorAuth();
  await surveys.deleteSurvey(id);
  revalidatePath(SURVEYS_PATH);
  return { success: true };
}

export async function getSurveyDetail(id: string) {
  await requireCounselorAuth();
  const survey = await surveys.getSurvey(id);
  if (!survey) return null;

  return {
    id: survey.id,
    title: survey.title,
    description: survey.description ?? "",
    isActive: survey.isActive,
    questions: survey.questions.map((q) => ({
      id: q.id,
      text: q.text,
      category: q.category ?? "",
      orderNumber: q.orderNumber,
    })),
  };
}

export async function saveQuestion(fd: FormData) {
  await requireCounselorAuth();
  const surveyId = text(fd, "surveyId");
  const questionText = text(fd, "text");
  if (!surveyId || !questionText) return { error: "Pertanyaan wajib diisi" };

  await surveys.saveQuestion({
    id: text(fd, "id"),
    surveyId,
    text: questionText,
    category: text(fd, "category"),
  });

  revalidatePath(`${SURVEYS_PATH}/${surveyId}`);
  return { success: true };
}

export async function deleteQuestion(id: string, surveyId: string) {
  await requireCounselorAuth();
  await surveys.deleteQuestion(id);
  revalidatePath(`${SURVEYS_PATH}/${surveyId}`);
  return { success: true };
}

export async function getSurveyResults(id: string) {
  await requireCounselorAuth();
  const survey = await surveys.getSurveyWithResponses(id);
  if (!survey) return null;

  const { perQuestion, priorities } = surveys.summarizeSurvey(survey);
  const toRow = (q: surveys.QuestionSummary) => ({
    id: q.questionId,
    text: q.text,
    category: q.category ?? "",
    avg: q.average,
    count: q.answerCount,
  });

  return {
    id: survey.id,
    title: survey.title,
    responseCount: survey.responses.length,
    perQuestion: perQuestion.map(toRow),
    priorities: priorities.map(toRow),
    responses: survey.responses.map((r) => ({
      id: r.id,
      studentName: r.student.user.name,
      className: r.student.class?.name ?? "-",
      submittedAt: r.submittedAt,
    })),
  };
}
