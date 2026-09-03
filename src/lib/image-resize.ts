/**
 * Perkecil foto di browser sebelum diunggah.
 *
 * Foto langsung dari kamera HP bisa 4-8 MB per berkas; dengan ratusan siswa
 * penyimpanan cepat membengkak dan unggahan lewat kuota sekolah jadi lambat.
 * Dipakai untuk foto biodata siswa.
 */

export type ResizeOptions = {
  /** Sisi terpanjang hasil akhir, dalam piksel. */
  maxSize?: number;
  /** Mutu JPEG 0-1. */
  quality?: number;
};

export async function resizeImage(file: File, { maxSize = 800, quality = 0.82 }: ResizeOptions = {}) {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file; // format tidak didukung peramban: kirim apa adanya.

  const skala = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const lebar = Math.round(bitmap.width * skala);
  const tinggi = Math.round(bitmap.height * skala);

  const canvas = document.createElement("canvas");
  canvas.width = lebar;
  canvas.height = tinggi;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, lebar, tinggi);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob || blob.size >= file.size) return file; // hasil tidak lebih kecil: tidak ada gunanya.

  const nama = file.name.replace(/\.[^.]+$/, "") || "foto";
  return new File([blob], `${nama}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}
