export type ExamType = "UH" | "UTS" | "UAS" | "US" | "TRYOUT" | "LAINNYA";

export const EXAM_TYPES: { value: ExamType; label: string; short: string; color: string }[] = [
  { value: "UH",      label: "Ulangan Harian",        short: "UH",     color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "UTS",     label: "Ujian Tengah Semester", short: "UTS",    color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "UAS",     label: "Ujian Akhir Semester",  short: "UAS",    color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "US",      label: "Ujian Sekolah",         short: "US",     color: "bg-red-100 text-red-700 border-red-200" },
  { value: "TRYOUT",  label: "Tryout / Latihan",      short: "Tryout", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { value: "LAINNYA", label: "Lainnya",               short: "Lain",   color: "bg-gray-100 text-gray-600 border-gray-200" },
];

export function getExamTypeInfo(type: string | null | undefined) {
  return EXAM_TYPES.find((t) => t.value === type) ?? EXAM_TYPES[5];
}
