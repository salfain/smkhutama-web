"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getExams() {
  return prisma.exam.findMany({
    orderBy: { startAt: "desc" },
    include: {
      subject: { select: { name: true, code: true } },
      teacher: { include: { user: { select: { name: true } } } },
      classes: { include: { class: { select: { name: true } } } },
      _count: { select: { questions: true, attempts: true } },
    },
  });
}

export async function getExamFormData() {
  const [subjects, teachers, classes, academicYears] = await Promise.all([
    prisma.subject.findMany({
      orderBy: { code: "asc" },
      select: { id: true, name: true, code: true },
    }),
    prisma.teacher.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { name: true } },
        subject: { select: { code: true } },
      },
    }),
    prisma.class.findMany({
      orderBy: [{ grade: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.academicYear.findMany({
      orderBy: [{ year: "desc" }, { semester: "asc" }],
      select: { id: true, year: true, semester: true, isActive: true },
    }),
  ]);
  return { subjects, teachers, classes, academicYears };
}

export async function createExam(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  const teacherId = String(formData.get("teacherId") ?? "").trim();
  const academicYearId = String(formData.get("academicYearId") ?? "").trim();
  const durationMinutes = Number(formData.get("durationMinutes") ?? "0");
  const startAt = String(formData.get("startAt") ?? "").trim();
  const endAt = String(formData.get("endAt") ?? "").trim();
  const passingScoreRaw = String(formData.get("passingScore") ?? "").trim();
  const status = String(formData.get("status") ?? "DRAFT").trim();
  const examType = String(formData.get("examType") ?? "UH").trim() as
    "UH" | "UTS" | "UAS" | "US" | "TRYOUT" | "LAINNYA";
  const randomizeQuestions = formData.get("randomizeQuestions") === "on";
  const randomizeOptions = formData.get("randomizeOptions") === "on";
  const showResult = formData.get("showResult") === "on";
  const classIds = formData.getAll("classIds").map(String).filter(Boolean);

  if (!title || !subjectId || !teacherId) {
    return { error: "Judul, mata pelajaran, dan guru wajib diisi" };
  }
  if (!startAt || !endAt) return { error: "Waktu mulai dan selesai wajib diisi" };
  if (durationMinutes < 1) return { error: "Durasi minimal 1 menit" };
  if (new Date(startAt) >= new Date(endAt)) {
    return { error: "Waktu mulai harus sebelum waktu selesai" };
  }

  try {
    await prisma.exam.create({
      data: {
        title,
        subjectId,
        teacherId,
        academicYearId: academicYearId || null,
        durationMinutes,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        passingScore: passingScoreRaw ? Number(passingScoreRaw) : null,
        randomizeQuestions,
        randomizeOptions,
        showResult,
        status: status as "DRAFT" | "ACTIVE" | "CLOSED",
        examType,
        classes: classIds.length > 0
          ? { create: classIds.map((cid) => ({ classId: cid })) }
          : undefined,
      },
    });
    revalidatePath("/admin/exams");
    return { success: true };
  } catch {
    return { error: "Gagal membuat jadwal ujian" };
  }
}

export async function updateExam(id: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  const teacherId = String(formData.get("teacherId") ?? "").trim();
  const academicYearId = String(formData.get("academicYearId") ?? "").trim();
  const durationMinutes = Number(formData.get("durationMinutes") ?? "0");
  const startAt = String(formData.get("startAt") ?? "").trim();
  const endAt = String(formData.get("endAt") ?? "").trim();
  const passingScoreRaw = String(formData.get("passingScore") ?? "").trim();
  const status = String(formData.get("status") ?? "DRAFT").trim();
  const examType = String(formData.get("examType") ?? "UH").trim() as
    "UH" | "UTS" | "UAS" | "US" | "TRYOUT" | "LAINNYA";
  const randomizeQuestions = formData.get("randomizeQuestions") === "on";
  const randomizeOptions = formData.get("randomizeOptions") === "on";
  const showResult = formData.get("showResult") === "on";
  const classIds = formData.getAll("classIds").map(String).filter(Boolean);

  if (!title || !subjectId || !teacherId) return { error: "Judul, mata pelajaran, dan guru wajib diisi" };
  if (!startAt || !endAt) return { error: "Waktu mulai dan selesai wajib diisi" };
  if (durationMinutes < 1) return { error: "Durasi minimal 1 menit" };
  if (new Date(startAt) >= new Date(endAt)) return { error: "Waktu mulai harus sebelum waktu selesai" };

  try {
    await prisma.$transaction([
      prisma.exam.update({
        where: { id },
        data: {
          title, subjectId, teacherId,
          academicYearId: academicYearId || null,
          durationMinutes,
          startAt: new Date(startAt),
          endAt: new Date(endAt),
          passingScore: passingScoreRaw ? Number(passingScoreRaw) : null,
          randomizeQuestions, randomizeOptions, showResult,
          status: status as "DRAFT" | "ACTIVE" | "CLOSED",
          examType,
        },
      }),
      // Replace class assignments
      prisma.examClass.deleteMany({ where: { examId: id } }),
      ...(classIds.length > 0
        ? [prisma.examClass.createMany({
            data: classIds.map((cid) => ({ examId: id, classId: cid })),
          })]
        : []),
    ]);
    revalidatePath("/admin/exams");
    return { success: true };
  } catch {
    return { error: "Gagal memperbarui jadwal ujian" };
  }
}

export async function changeExamStatus(id: string, status: "DRAFT" | "ACTIVE" | "CLOSED") {
  try {
    await prisma.exam.update({ where: { id }, data: { status } });
    revalidatePath("/admin/exams");
    return { success: true };
  } catch {
    return { error: "Gagal mengubah status ujian" };
  }
}

export async function deleteExam(id: string, force = false) {
  try {
    if (force) {
      // Hapus paksa: hapus semua data terkait ujian terlebih dahulu
      await prisma.$transaction([
        // Hapus jawaban siswa dari attempt ujian ini
        prisma.studentAnswer.deleteMany({
          where: { attempt: { examId: id } },
        }),
        // Hapus attempt ujian
        prisma.studentExamAttempt.deleteMany({ where: { examId: id } }),
        // Hapus token ujian
        prisma.examToken.deleteMany({ where: { examId: id } }),
        // Hapus sesi ujian
        prisma.examSession.deleteMany({ where: { examId: id } }),
        // Hapus soal-soal dalam ujian
        prisma.examQuestion.deleteMany({ where: { examId: id } }),
        // Hapus kelas peserta
        prisma.examClass.deleteMany({ where: { examId: id } }),
        // Hapus ujian itu sendiri
        prisma.exam.delete({ where: { id } }),
      ]);
    } else {
      // Hapus biasa: gagal jika ada data attempt
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
    revalidatePath("/admin/exams");
    return { success: true };
  } catch {
    return { error: "Gagal menghapus ujian. Mungkin masih ada data terkait lainnya." };
  }
}
