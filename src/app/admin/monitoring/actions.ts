"use server";

import { prisma } from "@/lib/prisma";
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
    await prisma.studentExamAttempt.update({
      where: { id: attemptId },
      data: { status: "NOT_STARTED", loginStatus: false, startedAt: null },
    });
    revalidatePath("/admin/monitoring");
    return { success: true };
  } catch {
    return { error: "Gagal reset login" };
  }
}
