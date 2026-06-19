"use server";

import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function getActiveExams() {
  return prisma.exam.findMany({
    where: { status: "ACTIVE" },
    orderBy: { startAt: "desc" },
    include: {
      subject: { select: { code: true } },
      teacher: { include: { user: { select: { name: true } } } },
      _count: { select: { attempts: true } },
    },
  });
}

export async function getExamMonitoring(examId: string | null) {
  if (!examId) {
    // Default: ambil ujian aktif pertama
    const firstActive = await prisma.exam.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { startAt: "desc" },
    });
    if (!firstActive) return null;
    examId = firstActive.id;
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      subject: { select: { code: true, name: true } },
      teacher: { include: { user: { select: { name: true } } } },
      classes: { include: { class: { select: { id: true, name: true } } } },
      _count: { select: { questions: true } },
    },
  });
  if (!exam) return null;

  // Ambil semua siswa di kelas-kelas peserta + status attempt mereka
  const classIds = exam.classes.map((c) => c.class.id);
  const students = await prisma.student.findMany({
    where: classIds.length > 0 ? { classId: { in: classIds } } : {},
    include: {
      user: { select: { name: true, isActive: true } },
      class: { select: { name: true } },
      attempts: {
        where: { examId },
        include: {
          _count: { select: { answers: true } },
        },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  return { exam, students };
}

export async function resetStudentLogin(attemptId: string) {
  try {
    const updated = await prisma.studentExamAttempt.update({
      where: { id: attemptId },
      data: { status: "NOT_STARTED", loginStatus: false, startedAt: null },
    });
    await logAudit({
      action: "RESET_STUDENT_LOGIN",
      entity: "studentExamAttempt",
      entityId: attemptId,
      details: { examId: updated.examId, studentId: updated.studentId },
    });
    revalidatePath("/admin/monitoring");
    return { success: true };
  } catch {
    return { error: "Gagal reset login" };
  }
}

/** Pengawas membuka kunci attempt yang ter-lock anti-cheat. */
export async function unlockAttempt(attemptId: string) {
  try {
    const updated = await prisma.studentExamAttempt.update({
      where: { id: attemptId },
      data: { isLocked: false, lockedAt: null, lockReason: null, violationCount: 0 },
    });
    await logAudit({
      action: "UNLOCK_EXAM_ATTEMPT",
      entity: "studentExamAttempt",
      entityId: attemptId,
      details: { examId: updated.examId, studentId: updated.studentId },
    });
    revalidatePath("/admin/monitoring");
    return { success: true };
  } catch {
    return { error: "Gagal membuka kunci" };
  }
}

/** Pengawas memaksa submit attempt (mengumpulkan jawaban yang sudah ada). */
export async function forceSubmitAttempt(attemptId: string) {
  try {
    const attempt = await prisma.studentExamAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) return { error: "Attempt tidak ditemukan" };
    if (attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED") {
      return { error: "Sudah dikumpulkan" };
    }
    const updated = await prisma.studentExamAttempt.update({
      where: { id: attemptId },
      data: {
        status: "AUTO_SUBMITTED",
        submittedAt: new Date(),
        isLocked: true,
        lockReason: attempt.lockReason ?? "Dikumpulkan paksa oleh pengawas",
      },
    });
    await logAudit({
      action: "FORCE_SUBMIT_ATTEMPT",
      entity: "studentExamAttempt",
      entityId: attemptId,
      details: { examId: updated.examId, studentId: updated.studentId, previousStatus: attempt.status },
    });
    revalidatePath("/admin/monitoring");
    return { success: true };
  } catch {
    return { error: "Gagal submit paksa" };
  }
}
