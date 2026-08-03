"use server";

/**
 * Server action pengawasan ujian oleh guru.
 * Kendali attempt-nya dipinjam dari `@/server/modules/cbt/monitoring`,
 * sumber yang sama dengan versi admin dan API.
 */

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";
import {
  findAttemptWithExam,
  forceSubmitAttempt,
  unlockAttempt,
} from "@/server/modules/cbt/monitoring";

const MONITORING_PATH = "/teacher/monitoring";

/** Pastikan attempt ini milik ujian guru yang login. */
async function ensureOwn(attemptId: string) {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return null;

  const attempt = await findAttemptWithExam(attemptId);
  if (!attempt || attempt.exam.teacherId !== user.teacher.id) return null;
  return attempt;
}

export async function unlockAttemptByTeacher(attemptId: string) {
  const attempt = await ensureOwn(attemptId);
  if (!attempt) return { error: "Tidak diizinkan" };

  await unlockAttempt(attemptId, "TEACHER_UNLOCK_EXAM_ATTEMPT");
  revalidatePath(MONITORING_PATH);
  return { success: true };
}

export async function forceSubmitAttemptByTeacher(attemptId: string) {
  const attempt = await ensureOwn(attemptId);
  if (!attempt) return { error: "Tidak diizinkan" };

  const result = await forceSubmitAttempt(attemptId, "TEACHER_FORCE_SUBMIT_ATTEMPT");
  if (result === "ALREADY_SUBMITTED") return { error: "Sudah dikumpulkan" };

  revalidatePath(MONITORING_PATH);
  return { success: true };
}
