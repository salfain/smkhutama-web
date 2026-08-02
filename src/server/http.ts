/**
 * Kernel HTTP untuk API v1.
 *
 * Semua route di `/api/v1` memakai helper di file ini supaya bentuk response,
 * kode error, dan header CORS-nya seragam di seluruh modul (landing, cbt, bk,
 * piket). Route lama di `/api/*` sengaja tidak diubah bentuk response-nya —
 * lihat `docs/api-v1-plan.md`.
 *
 * Bentuk response v1:
 *   sukses → { success: true, data: <payload> }
 *   gagal  → { success: false, error: { code, message } }
 */

import { NextResponse } from "next/server";

// Header CORS tidak diset di sini: `next.config.ts` sudah menerapkannya untuk
// seluruh `/api/:path*`. Route hanya perlu menyediakan handler `OPTIONS`.

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; error: { code: string; message: string } };

/**
 * Error yang sudah "siap dikirim" ke klien. Dilempar dari service/guard,
 * ditangkap oleh `handle()` dan diubah jadi response JSON.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (message: string, code = "BAD_REQUEST") => new ApiError(400, code, message);
export const unauthorized = (message = "Sesi tidak valid atau sudah berakhir", code = "UNAUTHORIZED") =>
  new ApiError(401, code, message);
export const forbidden = (message = "Anda tidak punya akses ke sumber daya ini", code = "FORBIDDEN") =>
  new ApiError(403, code, message);
export const notFound = (message = "Data tidak ditemukan", code = "NOT_FOUND") =>
  new ApiError(404, code, message);

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, data }, { status });
}

export function apiFail(error: ApiError) {
  return NextResponse.json<ApiFailure>(
    { success: false, error: { code: error.code, message: error.message } },
    { status: error.status }
  );
}

/**
 * Bungkus isi route handler. `ApiError` jadi response sesuai status-nya,
 * error lain jadi 500 tanpa membocorkan detail internal ke klien.
 */
export async function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) return apiFail(err);
    console.error("[api/v1] unhandled error:", err);
    return apiFail(new ApiError(500, "INTERNAL_ERROR", "Terjadi kesalahan pada server"));
  }
}

/** Response untuk preflight CORS; header-nya ditambahkan oleh `next.config.ts`. */
export function preflight() {
  return new NextResponse(null, { status: 204 });
}

/** Baca body JSON; body kosong/rusak dianggap objek kosong, bukan crash. */
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Ambil field string wajib dari body JSON. */
export function requiredString(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw badRequest(`Field "${field}" wajib diisi`, "VALIDATION_ERROR");
  return text;
}

/** Ambil field string opsional; string kosong dianggap null. */
export function optionalString(body: Record<string, unknown>, field: string): string | null {
  const value = body[field];
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

/** Ambil field angka bulat; nilai yang tidak terbaca memakai `fallback`. */
export function intField(body: Record<string, unknown>, field: string, fallback = 0): number {
  const value = body[field];
  const parsed = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

/** Ambil field boolean; menerima boolean asli maupun "true"/"on"/"1". */
export function boolField(body: Record<string, unknown>, field: string, fallback = false): boolean {
  const value = body[field];
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["1", "true", "yes", "on"].includes(value.toLowerCase());
  return fallback;
}

/**
 * Ambil field yang nilainya harus salah satu dari daftar yang diizinkan.
 * Tanpa `fallback`, nilai di luar daftar ditolak sebagai 400.
 */
export function oneOf<T extends string>(
  body: Record<string, unknown>,
  field: string,
  allowed: readonly T[],
  fallback?: T
): T {
  const value = typeof body[field] === "string" ? (body[field] as string).trim() : "";
  if ((allowed as readonly string[]).includes(value)) return value as T;
  if (fallback !== undefined && !value) return fallback;
  throw badRequest(
    `Field "${field}" harus salah satu dari: ${allowed.join(", ")}`,
    "VALIDATION_ERROR"
  );
}
