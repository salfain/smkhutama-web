"use server";

/**
 * Server action pengawasan ujian oleh admin.
 * Query dan kendali attempt-nya dipinjam dari
 * `@/server/modules/cbt/monitoring` — sumber yang sama dengan versi guru.
 */

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";
import * as monitoring from "@/server/modules/cbt/monitoring";

const MONITORING_PATH = "/admin/monitoring";

export async function getActiveExams() {
  await requireAuth("ADMIN");
  return monitoring.listActiveExams();
}

export async function getExamMonitoring(examId: string | null) {
  await requireAuth("ADMIN");
  return monitoring.getExamMonitoring(examId);
}

export async function resetStudentLogin(attemptId: string) {
  await requireAuth("ADMIN");
  try {
    const result = await monitoring.resetAttemptLogin(attemptId, "RESET_STUDENT_LOGIN");
    if (result === "NOT_FOUND") return { error: "Gagal reset login" };

    revalidatePath(MONITORING_PATH);
    return { success: true };
  } catch {
    return { error: "Gagal reset login" };
  }
}

/** Pengawas membuka kunci attempt yang ter-lock anti-cheat. */
export async function unlockAttempt(attemptId: string) {
  await requireAuth("ADMIN");
  try {
    const result = await monitoring.unlockAttempt(attemptId, "UNLOCK_EXAM_ATTEMPT");
    if (result === "NOT_FOUND") return { error: "Gagal membuka kunci" };

    revalidatePath(MONITORING_PATH);
    return { success: true };
  } catch {
    return { error: "Gagal membuka kunci" };
  }
}

/** Pengawas memaksa submit attempt (mengumpulkan jawaban yang sudah ada). */
export async function forceSubmitAttempt(attemptId: string) {
  await requireAuth("ADMIN");
  try {
    const result = await monitoring.forceSubmitAttempt(attemptId, "FORCE_SUBMIT_ATTEMPT");
    if (result === "NOT_FOUND") return { error: "Attempt tidak ditemukan" };
    if (result === "ALREADY_SUBMITTED") return { error: "Sudah dikumpulkan" };

    revalidatePath(MONITORING_PATH);
    return { success: true };
  } catch {
    return { error: "Gagal submit paksa" };
  }
}
