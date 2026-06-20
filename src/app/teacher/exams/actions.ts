"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

const TEACHER_EXAM_LOCK_MESSAGE =
  "Pembuatan, aktivasi, penghapusan ujian, dan token kini dikelola oleh admin.";

export async function getMyExams() {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return [];

  return prisma.exam.findMany({
    where: { teacherId: user.teacher.id },
    orderBy: { startAt: "desc" },
    include: {
      subject: { select: { code: true, name: true } },
      classes: { include: { class: { select: { name: true } } } },
      _count: { select: { questions: true, attempts: true } },
    },
  });
}

export async function getExamFormDataForTeacher() {
  await requireAuth("TEACHER");
  return { subjects: [], classes: [], academicYears: [], myQuestions: [] };
}

export async function createExamWithQuestions(_formData: FormData) {
  await requireAuth("TEACHER");
  return { error: TEACHER_EXAM_LOCK_MESSAGE };
}

export async function changeMyExamStatus(_id: string, _status: "DRAFT" | "ACTIVE" | "CLOSED") {
  await requireAuth("TEACHER");
  return { error: TEACHER_EXAM_LOCK_MESSAGE };
}

export async function deleteMyExam(_id: string, _force = false) {
  await requireAuth("TEACHER");
  return { error: TEACHER_EXAM_LOCK_MESSAGE };
}

export async function getMyExamTokens(_examId: string) {
  await requireAuth("TEACHER");
  return [];
}

export async function createTokenByTeacher(_examId: string, _durationMinutes = 60) {
  await requireAuth("TEACHER");
  return { error: TEACHER_EXAM_LOCK_MESSAGE };
}
