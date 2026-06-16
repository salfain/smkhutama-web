"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getMyQuestions() {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return [];
  return prisma.question.findMany({
    where: { teacherId: user.teacher.id },
    orderBy: { createdAt: "desc" },
    include: {
      subject: { select: { name: true, code: true } },
      _count: { select: { options: true, examQuestions: true } },
    },
  });
}

export async function getSubjectsForQuestion() {
  return prisma.subject.findMany({
    orderBy: { code: "asc" },
    select: { id: true, name: true, code: true },
  });
}

export async function getQuestionById(id: string) {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return null;
  return prisma.question.findFirst({
    where: { id, teacherId: user.teacher.id },
    include: { options: { orderBy: { orderNumber: "asc" } }, subject: true },
  });
}

type OptionInput = { label: string; text: string; correct: boolean };

export async function createQuestion(formData: FormData) {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return { error: "Guru tidak terdaftar" };

  const subjectId = String(formData.get("subjectId") ?? "").trim() || user.teacher.subjectId;
  const grade = String(formData.get("grade") ?? "").trim();
  const difficulty = String(formData.get("difficulty") ?? "MEDIUM").trim() as "EASY" | "MEDIUM" | "HARD";
  const questionType = String(formData.get("questionType") ?? "MULTIPLE_CHOICE").trim() as
    "MULTIPLE_CHOICE" | "MULTIPLE_CHOICE_COMPLEX" | "TRUE_FALSE" | "MATCHING" | "SHORT_ANSWER" | "ESSAY";
  const questionText = String(formData.get("questionText") ?? "").trim();
  const explanation = String(formData.get("explanation") ?? "").trim();
  const material = String(formData.get("material") ?? "").trim();
  const scoreWeight = Number(formData.get("scoreWeight") ?? "1");
  const optionsJson = String(formData.get("options") ?? "[]");

  if (!subjectId) return { error: "Mata pelajaran wajib dipilih" };
  if (!questionText) return { error: "Teks soal wajib diisi" };

  let options: OptionInput[] = [];
  try { options = JSON.parse(optionsJson); } catch { options = []; }

  const needsOptions = ["MULTIPLE_CHOICE", "MULTIPLE_CHOICE_COMPLEX", "TRUE_FALSE"].includes(questionType);
  if (needsOptions) {
    if (options.length < 2) return { error: "Minimal 2 pilihan jawaban" };
    if (!options.some((o) => o.correct)) return { error: "Tandai minimal 1 jawaban benar" };
    if (options.some((o) => !o.text.trim())) return { error: "Semua pilihan jawaban wajib diisi" };
  }

  try {
    await prisma.question.create({
      data: {
        subjectId,
        teacherId: user.teacher.id,
        questionType,
        questionText,
        difficulty,
        scoreWeight,
        explanation: explanation || null,
        material: material || null,
        grade: grade || null,
        isActive: true,
        options: needsOptions
          ? { create: options.map((o, i) => ({
              optionLabel: o.label,
              optionText: o.text,
              isCorrect: o.correct,
              orderNumber: i + 1,
            })) }
          : undefined,
      },
    });
    revalidatePath("/teacher/questions");
    return { success: true };
  } catch {
    return { error: "Gagal menyimpan soal" };
  }
}

export async function updateQuestion(id: string, formData: FormData) {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return { error: "Guru tidak terdaftar" };

  const subjectId = String(formData.get("subjectId") ?? "").trim();
  const grade = String(formData.get("grade") ?? "").trim();
  const difficulty = String(formData.get("difficulty") ?? "MEDIUM").trim() as "EASY" | "MEDIUM" | "HARD";
  const questionType = String(formData.get("questionType") ?? "MULTIPLE_CHOICE").trim() as
    "MULTIPLE_CHOICE" | "MULTIPLE_CHOICE_COMPLEX" | "TRUE_FALSE" | "MATCHING" | "SHORT_ANSWER" | "ESSAY";
  const questionText = String(formData.get("questionText") ?? "").trim();
  const explanation = String(formData.get("explanation") ?? "").trim();
  const material = String(formData.get("material") ?? "").trim();
  const scoreWeight = Number(formData.get("scoreWeight") ?? "1");
  const optionsJson = String(formData.get("options") ?? "[]");

  if (!subjectId) return { error: "Mata pelajaran wajib dipilih" };
  if (!questionText) return { error: "Teks soal wajib diisi" };

  let options: OptionInput[] = [];
  try { options = JSON.parse(optionsJson); } catch { options = []; }

  const needsOptions = ["MULTIPLE_CHOICE", "MULTIPLE_CHOICE_COMPLEX", "TRUE_FALSE"].includes(questionType);
  if (needsOptions) {
    if (options.length < 2) return { error: "Minimal 2 pilihan jawaban" };
    if (!options.some((o) => o.correct)) return { error: "Tandai minimal 1 jawaban benar" };
    if (options.some((o) => !o.text.trim())) return { error: "Semua pilihan jawaban wajib diisi" };
  }

  try {
    const existing = await prisma.question.findFirst({
      where: { id, teacherId: user.teacher.id },
    });
    if (!existing) return { error: "Soal tidak ditemukan" };

    await prisma.$transaction([
      prisma.question.update({
        where: { id },
        data: {
          subjectId, questionType, questionText, difficulty, scoreWeight,
          explanation: explanation || null,
          material: material || null,
          grade: grade || null,
        },
      }),
      prisma.questionOption.deleteMany({ where: { questionId: id } }),
      ...(needsOptions ? [
        prisma.questionOption.createMany({
          data: options.map((o, i) => ({
            questionId: id,
            optionLabel: o.label,
            optionText: o.text,
            isCorrect: o.correct,
            orderNumber: i + 1,
          })),
        }),
      ] : []),
    ]);
    revalidatePath("/teacher/questions");
    return { success: true };
  } catch {
    return { error: "Gagal memperbarui soal" };
  }
}

export async function deleteQuestion(id: string) {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return { error: "Guru tidak terdaftar" };

  try {
    const q = await prisma.question.findFirst({
      where: { id, teacherId: user.teacher.id },
      include: { _count: { select: { examQuestions: true } } },
    });
    if (!q) return { error: "Soal tidak ditemukan" };
    if (q._count.examQuestions > 0) {
      return { error: "Tidak dapat menghapus. Soal sedang dipakai dalam ujian." };
    }
    await prisma.question.delete({ where: { id } });
    revalidatePath("/teacher/questions");
    return { success: true };
  } catch {
    return { error: "Gagal menghapus soal" };
  }
}

export async function toggleQuestionActive(id: string) {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return { error: "Guru tidak terdaftar" };
  const q = await prisma.question.findFirst({ where: { id, teacherId: user.teacher.id } });
  if (!q) return { error: "Soal tidak ditemukan" };
  await prisma.question.update({ where: { id }, data: { isActive: !q.isActive } });
  revalidatePath("/teacher/questions");
  return { success: true };
}

// ====================================================
// IMPORT SOAL EXCEL
// ====================================================

const TYPE_MAP: Record<string, "MULTIPLE_CHOICE" | "MULTIPLE_CHOICE_COMPLEX" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY"> = {
  "PG": "MULTIPLE_CHOICE",
  "PILIHAN GANDA": "MULTIPLE_CHOICE",
  "MULTIPLE_CHOICE": "MULTIPLE_CHOICE",
  "PGK": "MULTIPLE_CHOICE_COMPLEX",
  "PILIHAN GANDA KOMPLEKS": "MULTIPLE_CHOICE_COMPLEX",
  "BS": "TRUE_FALSE",
  "BENAR/SALAH": "TRUE_FALSE",
  "BENAR-SALAH": "TRUE_FALSE",
  "TRUE_FALSE": "TRUE_FALSE",
  "ISIAN": "SHORT_ANSWER",
  "ISIAN SINGKAT": "SHORT_ANSWER",
  "SHORT_ANSWER": "SHORT_ANSWER",
  "ESAI": "ESSAY",
  "ESSAY": "ESSAY",
  "URAIAN": "ESSAY",
};

const DIFF_MAP: Record<string, "EASY" | "MEDIUM" | "HARD"> = {
  "MUDAH": "EASY", "EASY": "EASY",
  "SEDANG": "MEDIUM", "MEDIUM": "MEDIUM",
  "SULIT": "HARD", "HARD": "HARD",
};

export async function getQuestionImportTemplate() {
  const { generateExcel } = await import("@/lib/excel");

  const sample = [
    {
      jenis: "PG", mapel: "MTK", kelas: "XII", kesulitan: "SEDANG",
      materi: "Limit Fungsi", bobot: 1,
      soal: "Tentukan nilai lim(x→2) (x²-4)/(x-2)",
      a: "2", b: "4", c: "0", d: "Tidak terdefinisi", e: "",
      kunci: "B",
      pembahasan: "Faktorkan menjadi (x+2)(x-2)/(x-2) = x+2, lalu substitusi x=2 = 4",
    },
    {
      jenis: "PGK", mapel: "MTK", kelas: "XII", kesulitan: "SULIT",
      materi: "Bilangan", bobot: 2,
      soal: "Manakah yang termasuk bilangan prima?",
      a: "2", b: "3", c: "4", d: "5", e: "9",
      kunci: "A,B,D",
      pembahasan: "Bilangan prima: 2, 3, 5",
    },
    {
      jenis: "BS", mapel: "MTK", kelas: "XII", kesulitan: "MUDAH",
      materi: "Logika", bobot: 1,
      soal: "Persamaan x² = 4 hanya memiliki 1 solusi",
      a: "Benar", b: "Salah", c: "", d: "", e: "",
      kunci: "B",
      pembahasan: "x = 2 atau x = -2",
    },
    {
      jenis: "ISIAN", mapel: "MTK", kelas: "XII", kesulitan: "MUDAH",
      materi: "Aljabar", bobot: 1,
      soal: "Hasil dari 5 + 3 × 2 adalah ___",
      a: "", b: "", c: "", d: "", e: "",
      kunci: "11",
      pembahasan: "Operasi perkalian dulu: 3×2=6, lalu 5+6=11",
    },
    {
      jenis: "ESAI", mapel: "MTK", kelas: "XII", kesulitan: "SEDANG",
      materi: "Limit", bobot: 5,
      soal: "Jelaskan konsep limit dan contoh penerapannya dalam kehidupan sehari-hari",
      a: "", b: "", c: "", d: "", e: "",
      kunci: "",
      pembahasan: "Jawaban menyebutkan: definisi, kecepatan sesaat, biaya marginal, dll",
    },
  ];

  const buf = await generateExcel("Template Soal", [
    { header: "Jenis Soal",        key: "jenis",     width: 14 },
    { header: "Kode Mapel",        key: "mapel",     width: 12 },
    { header: "Kelas",             key: "kelas",     width: 8  },
    { header: "Tingkat Kesulitan", key: "kesulitan", width: 14 },
    { header: "Materi",            key: "materi",    width: 24 },
    { header: "Bobot",             key: "bobot",     width: 8  },
    { header: "Teks Soal",         key: "soal",      width: 50 },
    { header: "Pilihan A",         key: "a",         width: 22 },
    { header: "Pilihan B",         key: "b",         width: 22 },
    { header: "Pilihan C",         key: "c",         width: 22 },
    { header: "Pilihan D",         key: "d",         width: 22 },
    { header: "Pilihan E",         key: "e",         width: 22 },
    { header: "Kunci Jawaban",     key: "kunci",     width: 12 },
    { header: "Pembahasan",        key: "pembahasan",width: 36 },
  ], sample);

  return { data: Array.from(buf), filename: "template-import-soal.xlsx" };
}

export async function importQuestionsExcel(formData: FormData) {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return { error: "Guru tidak terdaftar" };
  const teacherId = user.teacher.id;

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "File wajib dipilih" };

  const { parseExcel } = await import("@/lib/excel");
  const bytes = await file.arrayBuffer();
  const rows = await parseExcel(bytes);
  if (rows.length === 0) return { error: "File kosong atau format tidak valid" };

  // Cache subjects untuk lookup cepat
  const subjects = await prisma.subject.findMany({ select: { id: true, code: true } });
  const subjectMap = new Map(subjects.map((s) => [s.code.toUpperCase(), s.id]));

  let created = 0;
  const errors: string[] = [];

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2;
    const jenisRaw = (row["Jenis Soal"] ?? row["jenis"] ?? "").trim().toUpperCase();
    const mapelCode = (row["Kode Mapel"] ?? row["mapel"] ?? "").trim().toUpperCase();
    const kelas = (row["Kelas"] ?? row["kelas"] ?? "").trim();
    const kesulitanRaw = (row["Tingkat Kesulitan"] ?? row["kesulitan"] ?? "SEDANG").trim().toUpperCase();
    const materi = (row["Materi"] ?? row["materi"] ?? "").trim();
    const bobotRaw = (row["Bobot"] ?? row["bobot"] ?? "1").toString().trim();
    const soal = (row["Teks Soal"] ?? row["soal"] ?? "").trim();
    const optA = (row["Pilihan A"] ?? row["a"] ?? "").trim();
    const optB = (row["Pilihan B"] ?? row["b"] ?? "").trim();
    const optC = (row["Pilihan C"] ?? row["c"] ?? "").trim();
    const optD = (row["Pilihan D"] ?? row["d"] ?? "").trim();
    const optE = (row["Pilihan E"] ?? row["e"] ?? "").trim();
    const kunci = (row["Kunci Jawaban"] ?? row["kunci"] ?? "").trim().toUpperCase();
    const pembahasan = (row["Pembahasan"] ?? row["pembahasan"] ?? "").trim();

    // ---- Validasi & mapping ----
    const questionType = TYPE_MAP[jenisRaw];
    if (!questionType) {
      errors.push(`Baris ${rowNum}: Jenis Soal "${jenisRaw}" tidak valid. Gunakan PG/PGK/BS/ISIAN/ESAI`);
      continue;
    }
    if (!soal) {
      errors.push(`Baris ${rowNum}: Teks Soal wajib diisi`);
      continue;
    }
    const subjectId = subjectMap.get(mapelCode);
    if (!subjectId) {
      errors.push(`Baris ${rowNum}: Kode Mapel "${mapelCode}" tidak ditemukan di database`);
      continue;
    }
    const difficulty = DIFF_MAP[kesulitanRaw] ?? "MEDIUM";
    const scoreWeight = parseFloat(bobotRaw) || 1;

    // Build options
    let options: { label: string; text: string; correct: boolean }[] = [];
    const needsOptions = ["MULTIPLE_CHOICE", "MULTIPLE_CHOICE_COMPLEX", "TRUE_FALSE"].includes(questionType);

    if (questionType === "TRUE_FALSE") {
      options = [
        { label: "A", text: optA || "Benar", correct: false },
        { label: "B", text: optB || "Salah", correct: false },
      ];
    } else if (needsOptions) {
      const raw = [
        { label: "A", text: optA }, { label: "B", text: optB },
        { label: "C", text: optC }, { label: "D", text: optD },
        { label: "E", text: optE },
      ].filter((o) => o.text.length > 0);
      options = raw.map((o) => ({ label: o.label, text: o.text, correct: false }));
    }

    if (needsOptions) {
      if (options.length < 2) {
        errors.push(`Baris ${rowNum}: Minimal 2 pilihan jawaban untuk soal ${jenisRaw}`);
        continue;
      }
      // Mark correct based on kunci
      const keys = kunci.split(/[,;\s]+/).map((k) => k.trim()).filter(Boolean);
      if (keys.length === 0) {
        errors.push(`Baris ${rowNum}: Kunci Jawaban wajib diisi (cth: A atau A,C)`);
        continue;
      }
      let validKeys = 0;
      for (const k of keys) {
        const opt = options.find((o) => o.label === k);
        if (opt) { opt.correct = true; validKeys++; }
      }
      if (validKeys === 0) {
        errors.push(`Baris ${rowNum}: Kunci jawaban "${kunci}" tidak cocok dengan pilihan`);
        continue;
      }
      if (questionType === "MULTIPLE_CHOICE" && keys.length > 1) {
        // Auto convert to PGK kalau >1 jawaban
      }
    }

    try {
      await prisma.question.create({
        data: {
          subjectId,
          teacherId,
          questionType,
          questionText: soal,
          difficulty,
          scoreWeight,
          explanation: pembahasan || null,
          material: materi || null,
          grade: kelas || null,
          isActive: true,
          options: needsOptions
            ? { create: options.map((o, idx) => ({
                optionLabel: o.label,
                optionText: o.text,
                isCorrect: o.correct,
                orderNumber: idx + 1,
              })) }
            : undefined,
        },
      });
      created++;
    } catch {
      errors.push(`Baris ${rowNum}: Gagal menyimpan soal "${soal.slice(0, 30)}..."`);
    }
  }

  revalidatePath("/teacher/questions");
  return {
    success: true,
    created,
    errors: errors.length > 0 ? errors : undefined,
    message: `${created} soal berhasil diimport${errors.length > 0 ? `, ${errors.length} baris gagal` : ""}`,
  };
}
