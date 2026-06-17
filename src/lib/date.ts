/**
 * Helper tanggal/waktu untuk CBT SMK HUTAMA.
 *
 * Browser mengirim string `datetime-local` tanpa informasi timezone,
 * misalnya "2026-06-18T09:00". JavaScript `new Date("2026-06-18T09:00")`
 * memperlakukannya sebagai UTC, sehingga di server (UTC) jam 09:00
 * sebenarnya berarti 16:00 WIB — salah 7 jam.
 *
 * `parseWIB` menambahkan offset +07:00 secara eksplisit agar waktu
 * yang diinput guru/admin selalu diinterpretasikan sebagai WIB.
 */

const WIB_OFFSET = "+07:00";

/**
 * Parse string datetime-local (format "YYYY-MM-DDTHH:mm") sebagai WIB.
 * Mengembalikan objek Date dalam UTC yang tepat.
 *
 * Contoh:
 *   parseWIB("2026-06-18T09:00")
 *   → Date sama dengan "2026-06-18T02:00:00.000Z" (09:00 WIB = 02:00 UTC)
 */
export function parseWIB(datetimeLocal: string): Date {
  // Jika string sudah punya info timezone (mis. "Z" atau "+07:00"), pakai langsung
  if (datetimeLocal.includes("Z") || datetimeLocal.includes("+") || datetimeLocal.includes("-", 10)) {
    return new Date(datetimeLocal);
  }
  return new Date(`${datetimeLocal}:00${WIB_OFFSET}`);
}

/**
 * Format Date ke string "YYYY-MM-DDTHH:mm" dalam zona WIB,
 * cocok untuk value input datetime-local.
 */
export function toDatetimeLocalWIB(d: Date): string {
  // Geser ke WIB (+7 jam) lalu format
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 16);
}
