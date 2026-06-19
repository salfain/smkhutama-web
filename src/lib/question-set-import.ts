import * as XLSX from "xlsx";

export type ParsedQuestion = {
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

export function parseQuestionSetWorkbook(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { questions: [] as ParsedQuestion[], errors: ["File tidak memiliki sheet"] };

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
