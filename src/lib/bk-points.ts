// Ambang poin pelanggaran → rekomendasi tindak lanjut (Surat Peringatan)
export type SpLevel = { level: string; min: number; label: string };

export const SP_THRESHOLDS: SpLevel[] = [
  { level: "PANGGILAN", min: 100, label: "Pemanggilan Orang Tua" },
  { level: "SP3", min: 75, label: "Surat Peringatan 3 (SP3)" },
  { level: "SP2", min: 50, label: "Surat Peringatan 2 (SP2)" },
  { level: "SP1", min: 25, label: "Surat Peringatan 1 (SP1)" },
];

/** Kembalikan rekomendasi tindak lanjut berdasarkan total poin pelanggaran. */
export function recommendedLevel(points: number): SpLevel | null {
  for (const t of SP_THRESHOLDS) {
    if (points >= t.min) return t;
  }
  return null;
}

export const SP_LABEL: Record<string, string> = {
  SP1: "Surat Peringatan 1",
  SP2: "Surat Peringatan 2",
  SP3: "Surat Peringatan 3",
  PANGGILAN: "Pemanggilan Orang Tua",
};
