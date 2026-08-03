"use server";

/**
 * Server action pengisian angket oleh siswa.
 * Query-nya dipinjam dari `@/server/modules/bk/surveys`.
 *
 * Catatan: form web menyimpan pertanyaan yang dilewati sebagai nilai 0,
 * sedangkan API v1 menolak nilai di luar 1–4. Perbedaan ini disengaja agar
 * perilaku halaman yang sudah berjalan tidak berubah — lihat bagian utang
 * teknis di docs/api-v1-plan.md.
 */

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";
import * as surveys from "@/server/modules/bk/surveys";

export async function listAvailableSurveys() {
  const user = await requireAuth("STUDENT");
  if (!user.student) return [];

  const rows = await surveys.listSurveysForStudent(user.student.id);
  return rows.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description ?? "",
    questionCount: s._count.questions,
    answered: s.responses.length > 0,
  }));
}

export async function getSurveyForFill(id: string) {
  const user = await requireAuth("STUDENT");
  if (!user.student) return null;

  const survey = await surveys.getSurveyForStudent(id, user.student.id);
  if (!survey) return null;

  return {
    id: survey.id,
    title: survey.title,
    description: survey.description ?? "",
    answered: survey.responses.length > 0,
    questions: survey.questions.map((q) => ({
      id: q.id,
      text: q.text,
      category: q.category ?? "",
    })),
  };
}

export async function submitSurvey(fd: FormData) {
  const user = await requireAuth("STUDENT");
  if (!user.student) return { error: "Data siswa tidak ditemukan" };

  const surveyId = String(fd.get("surveyId") ?? "").trim();
  if (!surveyId) return { error: "Angket tidak valid" };

  if (await surveys.hasResponded(surveyId, user.student.id)) {
    return { error: "Anda sudah mengisi angket ini." };
  }

  const questions = await surveys.listQuestionIds(surveyId);
  const answers = questions.map((q) => {
    const value = parseInt(String(fd.get(`q_${q.id}`) ?? "0"), 10);
    return { questionId: q.id, value: Number.isNaN(value) ? 0 : value };
  });

  try {
    await surveys.submitSurveyResponse(surveyId, user.student.id, answers);
    revalidatePath("/student/bk");
    return { success: true };
  } catch {
    return { error: "Gagal menyimpan jawaban." };
  }
}
