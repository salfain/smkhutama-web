"use server";

import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

type ParsedQuestion = {
  rowNumber: number;
  questionType: "MULTIPLE_CHOICE" | "ESSAY";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  questionText: string;
  isRandomized: boolean;
  randomizeOptions: boolean;
  mediaType: "NONE" | "IMAGE" | "AUDIO" | "VIDEO";
  mediaUrl: string | null;
  material: string | null;
  options: { label: string; text: string; mediaUrl: string | null; correct: boolean; orderNumber: number }[];
};

function value(row: unknown[], index: number): string {
  const raw = row[index];
  if (raw === null || raw === undefined) return "";
  return String(raw).trim();
}

function mapQuestionType(raw: string): "MULTIPLE_CHOICE" | "ESSAY" | null {
  const normalized = raw.trim().toUpperCase();
  if (["1", "PG", "PILIHAN GANDA", "MULTIPLE_CHOICE"].includes(normalized)) return "MULTIPLE_CHOICE";
  if (["2", "ESAI", "ESSAY", "URAIAN"].includes(normalized)) return "ESSAY";
  return null;
}

function mapDifficulty(raw: string): "EASY" | "MEDIUM" | "HARD" {
  const normalized = raw.trim().toUpperCase();
  if (["1", "MUDAH", "EASY"].includes(normalized)) return "EASY";
  if (["3", "SULIT", "HARD"].includes(normalized)) return "HARD";
  return "MEDIUM";
}

function mapMedia(audio: string, video: string, image: string) {
  if (image) return { mediaType: "IMAGE" as const, mediaUrl: image };
  if (audio) return { mediaType: "AUDIO" as const, mediaUrl: audio };
  if (video) return { mediaType: "VIDEO" as const, mediaUrl: video };
  return { mediaType: "NONE" as const, mediaUrl: null };
}

function parseWorkbook(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { questions: [], errors: ["File tidak memiliki sheet"] };

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
    raw: false,
  });

  const dataRows = rows.slice(2).filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""));
  const questions: ParsedQuestion[] = [];
  const errors: string[] = [];

  for (const [idx, row] of dataRows.entries()) {
    const rowNumber = idx + 3;
    const questionType = mapQuestionType(value(row, 1));
    const questionText = value(row, 4);

    if (!questionType) {
      errors.push(`Baris ${rowNumber}: JENIS SOAL harus 1 (PG) atau 2 (Esai)`);
      continue;
    }
    if (!questionText) {
      errors.push(`Baris ${rowNumber}: SOAL wajib diisi`);
      continue;
    }

    const difficulty = mapDifficulty(value(row, 2));
    const isRandomized = value(row, 3).toUpperCase() !== "T";
    const randomizeOptions = value(row, 19).toUpperCase() === "Y";
    const material = value(row, 20) || null;
    const media = mapMedia(value(row, 15), value(row, 16), value(row, 17));

    const optionTexts = [
      { textCol: 5, fileCol: 6, label: "A" },
      { textCol: 7, fileCol: 8, label: "B" },
      { textCol: 9, fileCol: 10, label: "C" },
      { textCol: 11, fileCol: 12, label: "D" },
      { textCol: 13, fileCol: 14, label: "E" },
    ].map((option, optionIdx) => ({
      label: option.label,
      text: value(row, option.textCol),
      mediaUrl: value(row, option.fileCol) || null,
      correct: false,
      orderNumber: optionIdx + 1,
    })).filter((option) => option.text || option.mediaUrl);

    if (questionType === "MULTIPLE_CHOICE") {
      const answerKey = Number(value(row, 18));
      if (optionTexts.length < 2) {
        errors.push(`Baris ${rowNumber}: Pilihan ganda minimal memiliki 2 opsi jawaban`);
        continue;
      }
      if (!Number.isInteger(answerKey) || answerKey < 1 || answerKey > optionTexts.length) {
        errors.push(`Baris ${rowNumber}: KUNCI JAWABAN harus angka 1-${optionTexts.length}`);
        continue;
      }
      optionTexts[answerKey - 1].correct = true;
    }

    questions.push({
      rowNumber,
      questionType,
      difficulty,
      questionText,
      isRandomized,
      randomizeOptions,
      mediaType: media.mediaType,
      mediaUrl: media.mediaUrl,
      material,
      options: questionType === "MULTIPLE_CHOICE" ? optionTexts : [],
    });
  }

  return { questions, errors };
}

export async function getQuestionSetImportData() {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return { subjects: [], defaultSubjectId: null };

  const subjects = await prisma.subject.findMany({
    orderBy: { code: "asc" },
    select: { id: true, name: true, code: true },
  });

  return { subjects, defaultSubjectId: user.teacher.subjectId };
}

export async function getMyQuestionSets() {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return [];

  return prisma.questionSet.findMany({
    where: { ownerTeacherId: user.teacher.id },
    orderBy: { createdAt: "desc" },
    include: {
      subject: { select: { code: true, name: true } },
      _count: { select: { questions: true } },
    },
  });
}

export async function importQuestionSet(formData: FormData) {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return { error: "Guru tidak terdaftar" };

  const title = String(formData.get("title") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "").trim() || user.teacher.subjectId;
  const examType = String(formData.get("examType") ?? "UTS").trim() as "UTS" | "UAS" | "US";
  const grade = String(formData.get("grade") ?? "").trim();
  const file = formData.get("file") as File | null;

  if (!title) return { error: "Nama paket wajib diisi" };
  if (!subjectId) return { error: "Mata pelajaran wajib dipilih" };
  if (!file || file.size === 0) return { error: "File Excel wajib dipilih" };

  const bytes = Buffer.from(await file.arrayBuffer());
  const { questions, errors } = parseWorkbook(bytes);
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
        ownerTeacherId: user.teacher.id,
        createdByUserId: user.id,
        createdByRole: "TEACHER",
        source: "TEACHER_IMPORT",
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
            teacherId: user.teacher!.id,
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
      action: "IMPORT_QUESTION_SET",
      entity: "questionSet",
      entityId: created.id,
      details: {
        title,
        subjectId,
        teacherId: user.teacher.id,
        totalQuestions: questions.length,
        multipleChoiceCount,
        essayCount,
        invalidCount: errors.length,
      },
    });

    revalidatePath("/teacher/question-sets");
    revalidatePath("/teacher/questions");
    return {
      success: true,
      questionSetId: created.id,
      message: `${questions.length} soal berhasil diimport ke paket "${title}"`,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch {
    return { error: "Gagal menyimpan paket soal" };
  }
}
