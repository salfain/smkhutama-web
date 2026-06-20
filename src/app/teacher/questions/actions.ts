"use server";

import { requireAuth } from "@/lib/session";

const TEACHER_QUESTION_LOCK_MESSAGE =
  "Input soal manual guru dinonaktifkan. Silakan import soal melalui Paket Bank Soal.";

export async function getMyQuestions() {
  await requireAuth("TEACHER");
  return [];
}

export async function getSubjectsForQuestion() {
  await requireAuth("TEACHER");
  return [];
}

export async function getQuestionById(_id: string) {
  await requireAuth("TEACHER");
  return null;
}

export async function createQuestion(_formData: FormData) {
  await requireAuth("TEACHER");
  return { error: TEACHER_QUESTION_LOCK_MESSAGE };
}

export async function updateQuestion(_id: string, _formData: FormData) {
  await requireAuth("TEACHER");
  return { error: TEACHER_QUESTION_LOCK_MESSAGE };
}

export async function deleteQuestion(_id: string) {
  await requireAuth("TEACHER");
  return { error: TEACHER_QUESTION_LOCK_MESSAGE };
}

export async function toggleQuestionActive(_id: string) {
  await requireAuth("TEACHER");
  return { error: TEACHER_QUESTION_LOCK_MESSAGE };
}

export async function getQuestionImportTemplate() {
  await requireAuth("TEACHER");
  return { data: [], filename: "template-import-soal.xlsx" };
}

export async function importQuestionsExcel(_formData: FormData) {
  await requireAuth("TEACHER");
  return { error: TEACHER_QUESTION_LOCK_MESSAGE };
}
