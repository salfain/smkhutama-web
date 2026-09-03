"use server";

/**
 * Server action halaman ujian siswa (versi web).
 *
 * Aturan akses, siklus attempt, dan penilaiannya dipinjam dari
 * `@/server/modules/cbt/exam-session` — sumber yang sama dengan route API,
 * sehingga ujian lewat browser dan lewat aplikasi mobile tidak bisa lagi
 * berbeda aturan.
 */

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";
import * as cbt from "@/server/modules/cbt/exam-session";
import { EXAM_ACCESS_MESSAGES } from "@/server/modules/cbt/http-errors";

/** Halaman web memakai kalimat "sudah kadaluarsa"; API memakai "kadaluarsa". */
const TOKEN_MESSAGES: Record<cbt.TokenCode, string> = {
  TOKEN_REQUIRED: "Token wajib diisi",
  TOKEN_INVALID: "Token tidak valid",
  TOKEN_EXPIRED: "Token sudah kadaluarsa",
};

export async function validateToken(examId: string, tokenInput: string) {
  const user = await requireAuth("STUDENT");
  if (!user.student) return { error: "Akun siswa tidak valid" };

  if (!tokenInput.trim()) return { error: TOKEN_MESSAGES.TOKEN_REQUIRED };

  const now = new Date();
  const exam = await cbt.findExamWithClasses(examId);
  const accessCode = cbt.checkExamAccess(exam, user.student.classId, now);
  if (accessCode) return { error: EXAM_ACCESS_MESSAGES[accessCode] };

  const tokenCode = await cbt.checkExamToken(examId, tokenInput, now);
  if (tokenCode) return { error: TOKEN_MESSAGES[tokenCode] };

  return { success: true };
}

export async function startAttempt(examId: string) {
  const user = await requireAuth("STUDENT");
  if (!user.student) throw new Error("Akun siswa tidak valid");

  // Token sudah divalidasi di langkah sebelumnya oleh halaman token.
  const result = await cbt.beginAttempt({
    examId,
    studentId: user.student.id,
    userId: user.id,
    auditAction: "START_EXAM_ATTEMPT",
  });

  if (result.status === "ALREADY_SUBMITTED") return { error: "Ujian sudah dikerjakan" };
  return { success: true };
}

export async function getExamForTaking(examId: string) {
  const user = await requireAuth("STUDENT");
  if (!user.student) return null;

  const [exam, attempt] = await Promise.all([
    cbt.getExamWithQuestions(examId),
    cbt.getAttemptWithAnswers(examId, user.student.id),
  ]);

  if (!exam || !attempt) return null;
  return { ...exam, attempt, finished: cbt.isSubmitted(attempt.status) };
}

export async function saveAnswer(input: {
  examId: string;
  questionId: string;
  selectedOptionId?: string | null;
  answerText?: string | null;
  isDoubtful?: boolean;
}) {
  const user = await requireAuth("STUDENT");
  if (!user.student) return { error: "Tidak diizinkan" };

  const result = await cbt.saveAnswer(input.examId, user.student.id, {
    questionId: input.questionId,
    selectedOptionId: input.selectedOptionId,
    answerText: input.answerText,
    isDoubtful: input.isDoubtful,
  });

  if (result === "NO_ATTEMPT") return { error: "Attempt tidak ditemukan" };
  if (result === "ALREADY_SUBMITTED") return { error: "Ujian sudah disubmit" };
  return { success: true };
}

export async function reportViolation(examId: string, reason?: string) {
  const user = await requireAuth("STUDENT");
  if (!user.student) return { error: "Tidak diizinkan" };

  const result = await cbt.recordViolation({
    examId,
    studentId: user.student.id,
    userId: user.id,
    reason,
  });

  if (result.state === "NO_ATTEMPT") return { error: "Attempt tidak ditemukan" };
  if (result.state === "FINISHED") {
    return { finished: true, locked: false, violationCount: result.violationCount, lockReason: null };
  }
  if (result.state === "LOCKED") {
    return { finished: false, locked: true, violationCount: result.violationCount, lockReason: result.lockReason };
  }
  return { finished: false, locked: result.locked, violationCount: result.violationCount, lockReason: result.lockReason };
}

/** Dipanggil berkala saat ujian terkunci, untuk mendeteksi kapan pengawas membuka kuncinya. */
export async function checkAttemptLock(examId: string) {
  const user = await requireAuth("STUDENT");
  if (!user.student) return { error: "Tidak diizinkan" };

  const result = await cbt.recordHeartbeat(examId, user.student.id);
  if (result.state === "NO_ATTEMPT") return { error: "Attempt tidak ditemukan" };
  if (result.state === "FINISHED") return { finished: true, locked: false };
  if (result.state === "LOCKED") return { finished: false, locked: true, lockReason: result.lockReason };
  return { finished: false, locked: false };
}

export async function submitExam(examId: string, isAuto = false) {
  const user = await requireAuth("STUDENT");
  if (!user.student) return { error: "Tidak diizinkan" };

  const result = await cbt.submitAttempt({
    examId,
    studentId: user.student.id,
    userId: user.id,
    isAuto,
    auditAction: isAuto ? "AUTO_SUBMIT_EXAM" : "SUBMIT_EXAM",
  });

  if (result.state === "NO_ATTEMPT") return { error: "Attempt tidak ditemukan" };

  revalidatePath(`/student/exams/${examId}`);
  return { success: true };
}
