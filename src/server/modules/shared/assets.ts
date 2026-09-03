/**
 * Berkas biner yang disajikan aplikasi: logo sekolah dan objek media di
 * Cloudflare R2.
 *
 * Berbeda dengan modul lain, hasilnya bukan JSON melainkan aliran byte, jadi
 * yang dikembalikan di sini bahan mentahnya - route yang membungkusnya jadi
 * response beserta header.
 */

import { readFile } from "fs/promises";
import path from "path";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { s3 } from "@/lib/r2";

const IMAGE_TYPES: Record<string, string> = {
  png: "image/png",
  webp: "image/webp",
  ico: "image/x-icon",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

/**
 * Logo sekolah dari `public/uploads`. Null bila belum diunggah atau berkasnya
 * hilang - pemanggil mengalihkan ke favicon bawaan.
 */
export async function readSchoolLogo() {
  const profile = await prisma.schoolProfile.findFirst().catch(() => null);
  if (!profile?.logo) return null;

  try {
    const buffer = await readFile(path.join(process.cwd(), "public", profile.logo));
    const ext = profile.logo.split(".").pop()?.toLowerCase() ?? "png";
    return { buffer, contentType: IMAGE_TYPES[ext] ?? "image/jpeg" };
  } catch {
    return null;
  }
}

export type MediaResult =
  | { state: "NOT_CONFIGURED" }
  | { state: "NOT_FOUND" }
  | { state: "OK"; body: ReadableStream; contentType?: string; contentLength?: number };

/** Ambil satu objek dari R2 berdasarkan key-nya. */
export async function readMediaObject(key: string): Promise<MediaResult> {
  if (!s3) return { state: "NOT_CONFIGURED" };

  try {
    const response = await s3.send(
      new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key })
    );
    if (!response.Body) return { state: "NOT_FOUND" };

    return {
      state: "OK",
      body: response.Body as ReadableStream,
      contentType: response.ContentType,
      contentLength: response.ContentLength,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "NoSuchKey") return { state: "NOT_FOUND" };
    console.error("[media] gagal membaca objek R2:", error);
    throw error;
  }
}
