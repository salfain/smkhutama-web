"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { parseWIB } from "@/lib/date";
import { logAudit } from "@/lib/audit";

export async function getExams() {
  return prisma.exam.findMany({
    orderBy: { startAt: "desc" },
    include: {
      subject: { select: { name: true, code: true } },
      teacher: { include: { user: { select: { name: true } } } },
      questionSet: { select: { id: true, title: true, totalQuestions: true } },
      classes: { include: { class: { select: { name: true } } } },
      _count: { select: { questions: true, attempts: true } },
    },
  });
}

export async function getExamFormData() {
  const [subjects, teachers, classes, academicYears, questionSets] = await Promise.all([
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
    prisma.questionSet.findMany({
      where: { status: { in: ["APPROVED", "USED"] } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        subjectId: true,
        ownerTeacherId: true,
        examType: true,
        totalQuestions: true,
        multipleChoiceCount: true,
        essayCount: true,
        status: true,
      },
    }),
  ]);
  return { subjects, teachers, classes, academicYears, questionSets };
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type QuestionSelectionRequest = {
  totalCount: number | null;
  multipleChoiceCount: number | null;
  essayCount: number | null;
};

function parseOptionalCount(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : Number.NaN;
}

function pickQuestionIds<T extends { id: string; isRandomized: boolean }>(questions: T[], count: number) {
  const fixed = questions.filter((q) => !q.isRandomized);
  const randomized = shuffle(questions.filter((q) => q.isRandomized));
  return [...fixed, ...randomized].slice(0, count);
}

async function getQuestionIdsForExam(questionSetId: string, request: QuestionSelectionRequest) {
  const questions = await prisma.question.findMany({
    where: { questionSetId, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, isRandomized: true, questionType: true },
  });

  const usesTypedCounts = request.multipleChoiceCount !== null || request.essayCount !== null;
  if (usesTypedCounts) {
    const multipleChoiceQuestions = questions.filter((q) => q.questionType === "MULTIPLE_CHOICE");
    const essayQuestions = questions.filter((q) => q.questionType === "ESSAY");
    const multipleChoiceTarget = request.multipleChoiceCount ?? 0;
    const essayTarget = request.essayCount ?? 0;

    if (multipleChoiceTarget > multipleChoiceQuestions.length) {
      return {
        ids: [],
        totalCount: 0,
        multipleChoiceCount: 0,
        essayCount: 0,
        error: `Jumlah PG diminta (${multipleChoiceTarget}) melebihi isi paket (${multipleChoiceQuestions.length})`,
      };
    }
    if (essayTarget > essayQuestions.length) {
      return {
        ids: [],
        totalCount: 0,
        multipleChoiceCount: 0,
        essayCount: 0,
        error: `Jumlah esai diminta (${essayTarget}) melebihi isi paket (${essayQuestions.length})`,
      };
    }

    const pickedMultipleChoice = pickQuestionIds(multipleChoiceQuestions, multipleChoiceTarget);
    const pickedEssay = pickQuestionIds(essayQuestions, essayTarget);
    const picked = [...pickedMultipleChoice, ...pickedEssay];

    return {
      ids: picked.map((q) => q.id),
      totalCount: picked.length,
      multipleChoiceCount: pickedMultipleChoice.length,
      essayCount: pickedEssay.length,
    };
  }

  const target = request.totalCount && request.totalCount > 0 ? request.totalCount : questions.length;
  if (target > questions.length) {
    return {
      ids: [],
      totalCount: 0,
      multipleChoiceCount: 0,
      essayCount: 0,
      error: `Jumlah soal diminta (${target}) melebihi isi paket (${questions.length})`,
    };
  }

  const picked = pickQuestionIds(questions, target);
  return {
    ids: picked.map((q) => q.id),
    totalCount: picked.length,
    multipleChoiceCount: picked.filter((q) => q.questionType === "MULTIPLE_CHOICE").length,
    essayCount: picked.filter((q) => q.questionType === "ESSAY").length,
  };
}

export async function createExam(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  const teacherId = String(formData.get("teacherId") ?? "").trim();
  const academicYearId = String(formData.get("academicYearId") ?? "").trim();
  const questionSetId = String(formData.get("questionSetId") ?? "").trim();
  const requestedQuestionCount = parseOptionalCount(formData.get("requestedQuestionCount"));
  const requestedMultipleChoiceCount = parseOptionalCount(formData.get("requestedMultipleChoiceCount"));
  const requestedEssayCount = parseOptionalCount(formData.get("requestedEssayCount"));
  const multipleChoicePercentage = Number(formData.get("multipleChoicePercentage") ?? "100");
  const essayPercentage = Number(formData.get("essayPercentage") ?? "0");
  const durationMinutes = Number(formData.get("durationMinutes") ?? "0");
  const startAt = String(formData.get("startAt") ?? "").trim();
  const endAt = String(formData.get("endAt") ?? "").trim();
  const passingScoreRaw = String(formData.get("passingScore") ?? "").trim();
  const status = String(formData.get("status") ?? "DRAFT").trim();
  const examType = String(formData.get("examType") ?? "UTS").trim() as "UTS" | "UAS" | "US";
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
  if (!["UTS", "UAS", "US"].includes(examType)) return { error: "Jenis ujian hanya boleh UTS, UAS, atau US" };
  if ([requestedQuestionCount, requestedMultipleChoiceCount, requestedEssayCount].some(Number.isNaN)) {
    return { error: "Jumlah soal harus berupa angka bulat 0 atau lebih" };
  }
  if (status !== "DRAFT" && !questionSetId) {
    return { error: "Pilih paket bank soal sebelum mengaktifkan ujian" };
  }
  if (multipleChoicePercentage < 0 || essayPercentage < 0 || multipleChoicePercentage + essayPercentage !== 100) {
    return { error: "Persentase PG dan esai harus berjumlah 100%" };
  }

  try {
    const questionSelection = questionSetId
      ? await getQuestionIdsForExam(questionSetId, {
          totalCount: requestedQuestionCount,
          multipleChoiceCount: requestedMultipleChoiceCount,
          essayCount: requestedEssayCount,
        })
      : null;
    if (questionSelection?.error) return { error: questionSelection.error };
    const questionIds = questionSelection?.ids ?? [];
    if (questionSetId && questionIds.length === 0) return { error: "Paket soal tidak memiliki soal aktif" };

    const created = await prisma.$transaction(async (tx) => {
      const exam = await tx.exam.create({
        data: {
          title,
          subjectId,
          teacherId,
          questionSetId: questionSetId || null,
          requestedQuestionCount: questionSelection?.totalCount ?? null,
          requestedMultipleChoiceCount: questionSelection?.multipleChoiceCount ?? null,
          requestedEssayCount: questionSelection?.essayCount ?? null,
          multipleChoicePercentage,
          essayPercentage,
          academicYearId: academicYearId || null,
          durationMinutes,
          startAt: parseWIB(startAt),
          endAt: parseWIB(endAt),
          passingScore: passingScoreRaw ? Number(passingScoreRaw) : null,
          randomizeQuestions,
          randomizeOptions,
          showResult,
          status: status as "DRAFT" | "ACTIVE" | "CLOSED",
          examType,
          classes: classIds.length > 0
            ? { create: classIds.map((cid) => ({ classId: cid })) }
            : undefined,
          questions: questionIds.length > 0
            ? { create: questionIds.map((qid, index) => ({ questionId: qid, orderNumber: index + 1 })) }
            : undefined,
        },
      });
      if (questionSetId) {
        await tx.questionSet.update({ where: { id: questionSetId }, data: { status: "USED" } });
      }
      return exam;
    });
    await logAudit({
      action: "CREATE_EXAM",
      entity: "exam",
      entityId: created.id,
      details: {
        title,
        subjectId,
        teacherId,
        questionSetId: questionSetId || null,
        questionCount: questionIds.length,
        multipleChoiceCount: questionSelection?.multipleChoiceCount ?? null,
        essayCount: questionSelection?.essayCount ?? null,
        status,
        examType,
        classCount: classIds.length,
      },
    });
    revalidatePath("/admin/exams");
    revalidatePath("/admin/question-sets");
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
  const questionSetId = String(formData.get("questionSetId") ?? "").trim();
  const requestedQuestionCount = parseOptionalCount(formData.get("requestedQuestionCount"));
  const requestedMultipleChoiceCount = parseOptionalCount(formData.get("requestedMultipleChoiceCount"));
  const requestedEssayCount = parseOptionalCount(formData.get("requestedEssayCount"));
  const multipleChoicePercentage = Number(formData.get("multipleChoicePercentage") ?? "100");
  const essayPercentage = Number(formData.get("essayPercentage") ?? "0");
  const durationMinutes = Number(formData.get("durationMinutes") ?? "0");
  const startAt = String(formData.get("startAt") ?? "").trim();
  const endAt = String(formData.get("endAt") ?? "").trim();
  const passingScoreRaw = String(formData.get("passingScore") ?? "").trim();
  const status = String(formData.get("status") ?? "DRAFT").trim();
  const examType = String(formData.get("examType") ?? "UTS").trim() as "UTS" | "UAS" | "US";
  const randomizeQuestions = formData.get("randomizeQuestions") === "on";
  const randomizeOptions = formData.get("randomizeOptions") === "on";
  const showResult = formData.get("showResult") === "on";
  const classIds = formData.getAll("classIds").map(String).filter(Boolean);

  if (!title || !subjectId || !teacherId) return { error: "Judul, mata pelajaran, dan guru wajib diisi" };
  if (!startAt || !endAt) return { error: "Waktu mulai dan selesai wajib diisi" };
  if (durationMinutes < 1) return { error: "Durasi minimal 1 menit" };
  if (new Date(startAt) >= new Date(endAt)) return { error: "Waktu mulai harus sebelum waktu selesai" };
  if (!["UTS", "UAS", "US"].includes(examType)) return { error: "Jenis ujian hanya boleh UTS, UAS, atau US" };
  if ([requestedQuestionCount, requestedMultipleChoiceCount, requestedEssayCount].some(Number.isNaN)) {
    return { error: "Jumlah soal harus berupa angka bulat 0 atau lebih" };
  }
  if (status !== "DRAFT" && !questionSetId) {
    return { error: "Pilih paket bank soal sebelum mengaktifkan ujian" };
  }
  if (multipleChoicePercentage < 0 || essayPercentage < 0 || multipleChoicePercentage + essayPercentage !== 100) {
    return { error: "Persentase PG dan esai harus berjumlah 100%" };
  }

  try {
    const previous = await prisma.exam.findUnique({
      where: { id },
      select: {
        title: true,
        status: true,
        questionSetId: true,
        requestedQuestionCount: true,
        requestedMultipleChoiceCount: true,
        requestedEssayCount: true,
      },
    });
    const countsChanged =
      requestedQuestionCount !== previous?.requestedQuestionCount ||
      requestedMultipleChoiceCount !== previous?.requestedMultipleChoiceCount ||
      requestedEssayCount !== previous?.requestedEssayCount;
    const shouldRefreshQuestions = Boolean(questionSetId && (questionSetId !== previous?.questionSetId || countsChanged));
    const shouldClearQuestions = Boolean(!questionSetId && previous?.questionSetId);
    const questionSelection = shouldRefreshQuestions
      ? await getQuestionIdsForExam(questionSetId, {
          totalCount: requestedQuestionCount,
          multipleChoiceCount: requestedMultipleChoiceCount,
          essayCount: requestedEssayCount,
        })
      : null;
    if (questionSelection?.error) return { error: questionSelection.error };
    const questionIds = questionSelection?.ids ?? (shouldClearQuestions ? [] : null);
    if (questionSetId && questionIds?.length === 0) return { error: "Paket soal tidak memiliki soal aktif" };

    await prisma.$transaction(async (tx) => {
      await tx.exam.update({
        where: { id },
        data: {
          title, subjectId, teacherId,
          questionSetId: questionSetId || null,
          requestedQuestionCount: questionSetId ? (questionSelection?.totalCount ?? requestedQuestionCount) : null,
          requestedMultipleChoiceCount: questionSetId ? (questionSelection?.multipleChoiceCount ?? requestedMultipleChoiceCount) : null,
          requestedEssayCount: questionSetId ? (questionSelection?.essayCount ?? requestedEssayCount) : null,
          multipleChoicePercentage,
          essayPercentage,
          academicYearId: academicYearId || null,
          durationMinutes,
          startAt: parseWIB(startAt),
          endAt: parseWIB(endAt),
          passingScore: passingScoreRaw ? Number(passingScoreRaw) : null,
          randomizeQuestions, randomizeOptions, showResult,
          status: status as "DRAFT" | "ACTIVE" | "CLOSED",
          examType,
        },
      });
      await tx.examClass.deleteMany({ where: { examId: id } });
      if (classIds.length > 0) {
        await tx.examClass.createMany({
          data: classIds.map((cid) => ({ examId: id, classId: cid })),
        });
      }
      if (questionIds !== null) {
        await tx.examQuestion.deleteMany({ where: { examId: id } });
        if (questionIds.length > 0) {
          await tx.examQuestion.createMany({
            data: questionIds.map((qid, index) => ({ examId: id, questionId: qid, orderNumber: index + 1 })),
          });
        }
      }
      if (questionSetId) {
        await tx.questionSet.update({ where: { id: questionSetId }, data: { status: "USED" } });
      }
    });
    await logAudit({
      action: "UPDATE_EXAM",
      entity: "exam",
      entityId: id,
      details: {
        previousTitle: previous?.title ?? null,
        previousStatus: previous?.status ?? null,
        title,
        questionSetId: questionSetId || null,
        questionCount: questionIds?.length ?? null,
        multipleChoiceCount: questionSelection?.multipleChoiceCount ?? requestedMultipleChoiceCount,
        essayCount: questionSelection?.essayCount ?? requestedEssayCount,
        status,
        examType,
        classCount: classIds.length,
      },
    });
    revalidatePath("/admin/exams");
    revalidatePath("/admin/question-sets");
    return { success: true };
  } catch {
    return { error: "Gagal memperbarui jadwal ujian" };
  }
}

export async function changeExamStatus(id: string, status: "DRAFT" | "ACTIVE" | "CLOSED") {
  try {
    const previous = await prisma.exam.findUnique({
      where: { id },
      select: {
        status: true,
        title: true,
        questionSetId: true,
        _count: { select: { questions: true } },
      },
    });
    if (status === "ACTIVE" && (!previous?.questionSetId || previous._count.questions === 0)) {
      return { error: "Pilih paket bank soal dan pastikan soal sudah masuk sebelum ujian diaktifkan" };
    }
    await prisma.exam.update({ where: { id }, data: { status } });
    await logAudit({
      action: "CHANGE_EXAM_STATUS",
      entity: "exam",
      entityId: id,
      details: { title: previous?.title ?? null, previousStatus: previous?.status ?? null, status },
    });
    revalidatePath("/admin/exams");
    return { success: true };
  } catch {
    return { error: "Gagal mengubah status ujian" };
  }
}

export async function deleteExam(id: string, force = false) {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id },
      select: { title: true, status: true },
    });
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
      await logAudit({
        action: "FORCE_DELETE_EXAM",
        entity: "exam",
        entityId: id,
        details: { title: exam?.title ?? null, status: exam?.status ?? null },
      });
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
      await logAudit({
        action: "DELETE_EXAM",
        entity: "exam",
        entityId: id,
        details: { title: exam?.title ?? null, status: exam?.status ?? null },
      });
    }
    revalidatePath("/admin/exams");
    return { success: true };
  } catch {
    return { error: "Gagal menghapus ujian. Mungkin masih ada data terkait lainnya." };
  }
}
