"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { parseWIB } from "@/lib/date";

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
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return { subjects: [], classes: [], academicYears: [], myQuestions: [] };

  const [subjects, classes, academicYears, myQuestions] = await Promise.all([
    prisma.subject.findMany({
      orderBy: { code: "asc" },
      select: { id: true, name: true, code: true },
    }),
    prisma.class.findMany({
      orderBy: [{ grade: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.academicYear.findMany({
      orderBy: [{ year: "desc" }],
      select: { id: true, year: true, semester: true, isActive: true },
    }),
    prisma.question.findMany({
      where: { teacherId: user.teacher.id, isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, questionText: true, questionType: true,
        difficulty: true, subjectId: true,
        subject: { select: { code: true } },
      },
    }),
  ]);

  return { subjects, classes, academicYears, myQuestions };
}

export async function createExamWithQuestions(formData: FormData) {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return { error: "Guru tidak terdaftar" };

  const title = String(formData.get("title") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  const academicYearId = String(formData.get("academicYearId") ?? "").trim();
  const durationMinutes = Number(formData.get("durationMinutes") ?? "0");
  const startAt = String(formData.get("startAt") ?? "").trim();
  const endAt = String(formData.get("endAt") ?? "").trim();
  const passingScore = String(formData.get("passingScore") ?? "").trim();
  const status = String(formData.get("status") ?? "DRAFT").trim() as "DRAFT" | "ACTIVE" | "CLOSED";
  const examType = String(formData.get("examType") ?? "UH").trim() as
    "UH" | "UTS" | "UAS" | "US" | "TRYOUT" | "LAINNYA";
  const randomizeQuestions = formData.get("randomizeQuestions") === "on";
  const randomizeOptions = formData.get("randomizeOptions") === "on";
  const showResult = formData.get("showResult") === "on";
  const classIds = formData.getAll("classIds").map(String).filter(Boolean);
  const questionIds = formData.getAll("questionIds").map(String).filter(Boolean);

  if (!title || !subjectId) return { error: "Judul dan mata pelajaran wajib diisi" };
  if (!startAt || !endAt) return { error: "Waktu mulai dan selesai wajib diisi" };
  if (durationMinutes < 1) return { error: "Durasi minimal 1 menit" };
  if (new Date(startAt) >= new Date(endAt)) return { error: "Waktu mulai harus sebelum waktu selesai" };
  if (questionIds.length === 0) return { error: "Pilih minimal 1 soal untuk ujian" };

  try {
    await prisma.exam.create({
      data: {
        title,
        subjectId,
        teacherId: user.teacher.id,
        academicYearId: academicYearId || null,
        durationMinutes,
        startAt: parseWIB(startAt),
        endAt: parseWIB(endAt),
        passingScore: passingScore ? Number(passingScore) : null,
        randomizeQuestions, randomizeOptions, showResult,
        status,
        examType,
        classes: classIds.length > 0
          ? { create: classIds.map((cid) => ({ classId: cid })) }
          : undefined,
        questions: {
          create: questionIds.map((qid, i) => ({
            questionId: qid,
            orderNumber: i + 1,
          })),
        },
      },
    });
    revalidatePath("/teacher/exams");
    return { success: true };
  } catch {
    return { error: "Gagal membuat ujian" };
  }
}

export async function changeMyExamStatus(id: string, status: "DRAFT" | "ACTIVE" | "CLOSED") {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return { error: "Tidak diizinkan" };
  try {
    await prisma.exam.update({
      where: { id, teacherId: user.teacher.id },
      data: { status },
    });
    revalidatePath("/teacher/exams");
    return { success: true };
  } catch {
    return { error: "Gagal mengubah status" };
  }
}

export async function deleteMyExam(id: string, force = false) {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return { error: "Tidak diizinkan" };
  try {
    const exam = await prisma.exam.findFirst({
      where: { id, teacherId: user.teacher.id },
    });
    if (!exam) return { error: "Ujian tidak ditemukan" };

    if (force) {
      // Hapus paksa beserta semua data terkait
      await prisma.$transaction([
        prisma.studentAnswer.deleteMany({ where: { attempt: { examId: id } } }),
        prisma.studentExamAttempt.deleteMany({ where: { examId: id } }),
        prisma.examToken.deleteMany({ where: { examId: id } }),
        prisma.examSession.deleteMany({ where: { examId: id } }),
        prisma.examQuestion.deleteMany({ where: { examId: id } }),
        prisma.examClass.deleteMany({ where: { examId: id } }),
        prisma.exam.delete({ where: { id } }),
      ]);
    } else {
      const attemptCount = await prisma.studentExamAttempt.count({ where: { examId: id } });
      if (attemptCount > 0) {
        return {
          error: `Ujian memiliki ${attemptCount} data percobaan siswa. Gunakan "Hapus Paksa" untuk menghapus beserta seluruh datanya.`,
          hasAttempts: true,
          attemptCount,
        };
      }
      await prisma.$transaction([
        prisma.examToken.deleteMany({ where: { examId: id } }),
        prisma.examSession.deleteMany({ where: { examId: id } }),
        prisma.examQuestion.deleteMany({ where: { examId: id } }),
        prisma.examClass.deleteMany({ where: { examId: id } }),
        prisma.exam.delete({ where: { id } }),
      ]);
    }
    revalidatePath("/teacher/exams");
    return { success: true };
  } catch {
    return { error: "Gagal menghapus ujian" };
  }
}

// ---- TOKEN MANAGEMENT BY TEACHER ----
export async function getMyExamTokens(examId: string) {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return [];
  // Pastikan exam milik guru ini
  const exam = await prisma.exam.findFirst({
    where: { id: examId, teacherId: user.teacher.id },
  });
  if (!exam) return [];
  return prisma.examToken.findMany({
    where: { examId },
    orderBy: { createdAt: "desc" },
  });
}

function generateRandomToken(prefix = ""): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return prefix ? `${prefix}-${num}` : `TKN-${num}`;
}

export async function createTokenByTeacher(examId: string, durationMinutes = 60) {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return { error: "Tidak diizinkan" };

  // Validasi exam milik guru dan boleh dibuatkan token oleh guru
  const exam = await prisma.exam.findFirst({
    where: { id: examId, teacherId: user.teacher.id },
    include: { subject: { select: { code: true } } },
  });
  if (!exam) return { error: "Ujian tidak ditemukan" };

  // Cek permission
  const { canTeacherCreateToken } = await import("@/lib/exam-permissions");
  if (!canTeacherCreateToken(exam.examType)) {
    return { error: `Token untuk ujian ${exam.examType} hanya dapat dibuat oleh Admin` };
  }

  // Generate unique token
  let token = generateRandomToken(exam.subject.code);
  let tries = 0;
  while (tries < 10) {
    const exists = await prisma.examToken.findUnique({ where: { token } });
    if (!exists) break;
    token = generateRandomToken(exam.subject.code);
    tries++;
  }

  const expiredAt = new Date(Date.now() + durationMinutes * 60 * 1000);

  try {
    const created = await prisma.examToken.create({
      data: { examId, token, expiredAt, isActive: true },
    });
    revalidatePath("/teacher/exams");
    return { success: true, token: created.token };
  } catch {
    return { error: "Gagal generate token" };
  }
}
