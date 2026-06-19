"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { calculateSubmissionScore } from "@/lib/exam-scoring";

export async function validateToken(examId: string, tokenInput: string) {
  const user = await requireAuth("STUDENT");
  if (!user.student) return { error: "Akun siswa tidak valid" };

  const trimmed = tokenInput.trim().toUpperCase();
  if (!trimmed) return { error: "Token wajib diisi" };

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { classes: true },
  });
  if (!exam) return { error: "Ujian tidak ditemukan" };
  if (exam.status !== "ACTIVE") return { error: "Ujian belum aktif" };
  const now = new Date();
  if (now < exam.startAt) return { error: "Ujian belum dimulai" };
  if (now > exam.endAt) return { error: "Ujian sudah berakhir" };

  // Cek peserta
  const isParticipant = exam.classes.some((c) => c.classId === user.student!.classId);
  if (!isParticipant && exam.classes.length > 0) {
    return { error: "Anda bukan peserta ujian ini" };
  }

  // Validasi token
  const token = await prisma.examToken.findFirst({
    where: { examId, token: trimmed, isActive: true },
  });
  if (!token) return { error: "Token tidak valid" };
  if (token.expiredAt < now) return { error: "Token sudah kadaluarsa" };

  return { success: true };
}

export async function startAttempt(examId: string) {
  const user = await requireAuth("STUDENT");
  if (!user.student) throw new Error("Akun siswa tidak valid");

  const studentId = user.student.id;
  const existing = await prisma.studentExamAttempt.findUnique({
    where: { examId_studentId: { examId, studentId } },
  });

  if (existing) {
    if (existing.status === "SUBMITTED" || existing.status === "AUTO_SUBMITTED") {
      return { error: "Ujian sudah dikerjakan" };
    }
    // Resume attempt
    if (!existing.startedAt) {
      await prisma.studentExamAttempt.update({
        where: { id: existing.id },
        data: { startedAt: new Date(), status: "IN_PROGRESS", loginStatus: true },
      });
      await logAudit({
        action: "START_EXAM_ATTEMPT",
        entity: "studentExamAttempt",
        entityId: existing.id,
        details: { examId, studentId },
      });
    }
    return { success: true };
  }

  const created = await prisma.studentExamAttempt.create({
    data: {
      examId, studentId,
      startedAt: new Date(),
      status: "IN_PROGRESS",
      loginStatus: true,
    },
  });
  await logAudit({
    action: "START_EXAM_ATTEMPT",
    entity: "studentExamAttempt",
    entityId: created.id,
    details: { examId, studentId },
  });

  return { success: true };
}

export async function getExamForTaking(examId: string) {
  const user = await requireAuth("STUDENT");
  if (!user.student) return null;

  const [exam, attempt] = await Promise.all([
    prisma.exam.findUnique({
      where: { id: examId },
      include: {
        subject: { select: { code: true, name: true } },
        questions: {
          orderBy: { orderNumber: "asc" },
          include: {
            question: {
              include: {
                options: { orderBy: { orderNumber: "asc" } },
              },
            },
          },
        },
      },
    }),
    prisma.studentExamAttempt.findUnique({
      where: { examId_studentId: { examId, studentId: user.student.id } },
      include: {
        answers: {
          select: {
            questionId: true, selectedOptionId: true,
            answerText: true, isDoubtful: true,
          },
        },
      },
    }),
  ]);

  if (!exam || !attempt) return null;
  if (attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED") {
    return { ...exam, attempt, finished: true };
  }

  return { ...exam, attempt, finished: false };
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

  const attempt = await prisma.studentExamAttempt.findUnique({
    where: { examId_studentId: { examId: input.examId, studentId: user.student.id } },
  });
  if (!attempt) return { error: "Attempt tidak ditemukan" };
  if (attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED") {
    return { error: "Ujian sudah disubmit" };
  }

  await prisma.studentAnswer.upsert({
    where: { attemptId_questionId: { attemptId: attempt.id, questionId: input.questionId } },
    update: {
      selectedOptionId: input.selectedOptionId ?? null,
      answerText: input.answerText ?? null,
      isDoubtful: input.isDoubtful ?? false,
      savedAt: new Date(),
    },
    create: {
      attemptId: attempt.id,
      questionId: input.questionId,
      selectedOptionId: input.selectedOptionId ?? null,
      answerText: input.answerText ?? null,
      isDoubtful: input.isDoubtful ?? false,
    },
  });

  return { success: true };
}

export async function submitExam(examId: string, isAuto = false) {
  const user = await requireAuth("STUDENT");
  if (!user.student) return { error: "Tidak diizinkan" };

  const attempt = await prisma.studentExamAttempt.findUnique({
    where: { examId_studentId: { examId, studentId: user.student.id } },
    include: {
      answers: { include: { question: { include: { options: true } } } },
      exam: {
        select: {
          showResult: true,
          multipleChoicePercentage: true,
          essayPercentage: true,
          questions: {
            include: { question: { select: { id: true, scoreWeight: true, questionType: true } } },
          },
        },
      },
    },
  });
  if (!attempt) return { error: "Attempt tidak ditemukan" };
  if (attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED") {
    return { success: true };
  }

  const { updates: answerUpdates, finalScore } = calculateSubmissionScore({
    questions: attempt.exam.questions.map((eq) => eq.question),
    answers: attempt.answers,
    multipleChoicePercentage: attempt.exam.multipleChoicePercentage,
    essayPercentage: attempt.exam.essayPercentage,
  });

  await prisma.$transaction([
    ...answerUpdates.map((u) =>
      prisma.studentAnswer.update({
        where: { id: u.id },
        data: { isCorrect: u.isCorrect, score: u.score },
      })
    ),
    prisma.studentExamAttempt.update({
      where: { id: attempt.id },
      data: {
        status: isAuto ? "AUTO_SUBMITTED" : "SUBMITTED",
        submittedAt: new Date(),
        score: finalScore,
        loginStatus: false,
      },
    }),
  ]);

  await logAudit({
    action: isAuto ? "AUTO_SUBMIT_EXAM" : "SUBMIT_EXAM",
    entity: "studentExamAttempt",
    entityId: attempt.id,
    details: { examId, studentId: user.student.id, score: finalScore },
  });

  revalidatePath(`/student/exams/${examId}`);
  return { success: true };
}
