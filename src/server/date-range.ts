/**
 * Helper rentang tanggal untuk query harian.
 *
 * CATATAN: batas hari dihitung memakai waktu lokal proses Node
 * (`setHours(0,0,0,0)`), sama persis dengan perilaku route dan server action
 * yang sudah berjalan. Di container produksi TZ-nya UTC, jadi "hari" di sini
 * adalah hari UTC, bukan WIB — pencatatan sebelum pukul 07:00 WIB masih
 * terhitung hari sebelumnya. Perilaku ini sengaja dipertahankan agar migrasi
 * ke API v1 tidak mengubah data; perbaikannya dicatat sebagai pekerjaan
 * terpisah di `docs/api-v1-plan.md`.
 */

export type DayRange = { start: Date; end: Date };

/** Awal dan akhir hari dari tanggal yang diberikan (default: hari ini). */
export function dayRange(input?: string | Date | null): DayRange {
  const parsed = input ? new Date(input) : new Date();
  const base = Number.isNaN(parsed.getTime()) ? new Date() : parsed;

  const start = new Date(base);
  start.setHours(0, 0, 0, 0);

  const end = new Date(base);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/** True untuk string tanggal berformat "YYYY-MM-DD". */
export function isDateOnly(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** String "YYYY-MM-DD" untuk hari ini, mengikuti waktu lokal proses. */
export function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}
