"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { parseQuestionSetWorkbook } from "@/lib/question-set-import";
import { revalidatePath } from "next/cache";

export async function getAdminQuestionSetData() {
  await requireAuth("ADMIN");

  const [questionSets, subjects, teachers] = await Promise.all([
    prisma.questionSet.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        subject: { select: { id: true, code: true, name: true } },
        ownerTeacher: { include: { user: { select: { name: true } } } },
        _count: { select: { questions: true, exams: true } },
      },
    }),
    prisma.subject.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.teacher.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { name: true } },
        subject: { select: { id: true, code: true, name: true } },
      },
    }),
  ]);

  return { questionSets, subjects, teachers };
}

export async function importQuestionSetForTeacher(formData: FormData) {
  const user = await requireAuth("ADMIN");

  const title = String(formData.get("title") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  const teacherId = String(formData.get("teacherId") ?? "").trim();
  const examType = String(formData.get("examType") ?? "UTS").trim() as "UTS" | "UAS" | "US";
  const grade = String(formData.get("grade") ?? "").trim();
  const file = formData.get("file") as File | null;

  if (!title) return { error: "Nama paket wajib diisi" };
  if (!subjectId) return { error: "Mata pelajaran wajib dipilih" };
  if (!teacherId) return { error: "Guru pemilik wajib dipilih" };
  if (!file || file.size === 0) return { error: "File Excel wajib dipilih" };

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { id: true },
  });
  if (!teacher) return { error: "Guru tidak ditemukan" };

  const bytes = Buffer.from(await file.arrayBuffer());
  const { questions, errors } = parseQuestionSetWorkbook(bytes);
  if (questions.length === 0) {
    return { error: errors[0] ?? "Tidak ada soal valid yang bisa diimport", errors };
  }

  const multipleChoiceCount = questions.filter((q) => q.questionType === "MULTIPLE_CHOICE").length;
  const essayCount = questions.filter((q) => q.questionType === "ESSAY").length;

  try {
    const created = await prisma.questionSet.create({
      data: {
        title,
        subjectId,
        ownerTeacherId: teacherId,
        createdByUserId: user.id,
        createdByRole: "ADMIN",
        source: "ADMIN_IMPORT",
        status: "APPROVED",
        examType,
        grade: grade || null,
        sourceFileName: file.name,
        totalQuestions: questions.length,
        multipleChoiceCount,
        essayCount,
        invalidCount: errors.length,
        questions: {
          create: questions.map((q) => ({
            subjectId,
            teacherId,
            questionType: q.questionType,
            questionText: q.questionText,
            difficulty: q.difficulty,
            mediaType: q.mediaType,
            mediaUrl: q.mediaUrl,
            material: q.material,
            grade: grade || null,
            isRandomized: q.isRandomized,
            randomizeOptions: q.randomizeOptions,
            isActive: true,
            options: q.options.length > 0
              ? {
                  create: q.options.map((option) => ({
                    optionLabel: option.label,
                    optionText: option.text,
                    mediaUrl: option.mediaUrl,
                    isCorrect: option.correct,
                    orderNumber: option.orderNumber,
                  })),
                }
              : undefined,
          })),
        },
      },
    });

    await logAudit({
      action: "ADMIN_IMPORT_QUESTION_SET",
      entity: "questionSet",
      entityId: created.id,
      details: {
        title,
        subjectId,
        teacherId,
        totalQuestions: questions.length,
        multipleChoiceCount,
        essayCount,
        invalidCount: errors.length,
      },
    });

    revalidatePath("/admin/question-sets");
    revalidatePath("/teacher/question-sets");
    return {
      success: true,
      message: `${questions.length} soal berhasil diimport untuk guru`,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch {
    return { error: "Gagal menyimpan paket soal" };
  }
}

export async function updateQuestionSetStatus(id: string, status: "DRAFT" | "SUBMITTED" | "APPROVED" | "USED") {
  await requireAuth("ADMIN");
  try {
    const previous = await prisma.questionSet.findUnique({
      where: { id },
      select: { title: true, status: true },
    });
    const updated = await prisma.questionSet.update({
      where: { id },
      data: { status },
    });
    await logAudit({
      action: "UPDATE_QUESTION_SET_STATUS",
      entity: "questionSet",
      entityId: id,
      details: {
        title: previous?.title ?? null,
        previousStatus: previous?.status ?? null,
        status: updated.status,
      },
    });
    revalidatePath("/admin/question-sets");
    revalidatePath("/teacher/question-sets");
    return { success: true };
  } catch {
    return { error: "Gagal mengubah status paket soal" };
  }
}
