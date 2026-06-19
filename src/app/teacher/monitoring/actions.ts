"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

/** Pastikan attempt ini milik ujian guru yang login. */
async function ensureOwn(attemptId: string) {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return null;
  const a = await prisma.studentExamAttempt.findUnique({
    where: { id: attemptId },
    include: { exam: true },
  });
  if (!a || a.exam.teacherId !== user.teacher.id) return null;
  return a;
}

export async function unlockAttemptByTeacher(attemptId: string) {
  const a = await ensureOwn(attemptId);
  if (!a) return { error: "Tidak diizinkan" };
  const updated = await prisma.studentExamAttempt.update({
    where: { id: a.id },
    data: { isLocked: false, lockedAt: null, lockReason: null, violationCount: 0 },
  });
  await logAudit({
    action: "TEACHER_UNLOCK_EXAM_ATTEMPT",
    entity: "studentExamAttempt",
    entityId: attemptId,
    details: { examId: updated.examId, studentId: updated.studentId },
  });
  revalidatePath("/teacher/monitoring");
  return { success: true };
}

export async function forceSubmitAttemptByTeacher(attemptId: string) {
  const a = await ensureOwn(attemptId);
  if (!a) return { error: "Tidak diizinkan" };
  if (a.status === "SUBMITTED" || a.status === "AUTO_SUBMITTED") return { error: "Sudah dikumpulkan" };
  const updated = await prisma.studentExamAttempt.update({
    where: { id: a.id },
    data: {
      status: "AUTO_SUBMITTED",
      submittedAt: new Date(),
      isLocked: true,
      lockReason: a.lockReason ?? "Dikumpulkan paksa oleh pengawas",
    },
  });
  await logAudit({
    action: "TEACHER_FORCE_SUBMIT_ATTEMPT",
    entity: "studentExamAttempt",
    entityId: attemptId,
    details: { examId: updated.examId, studentId: updated.studentId, previousStatus: a.status },
  });
  revalidatePath("/teacher/monitoring");
  return { success: true };
}
