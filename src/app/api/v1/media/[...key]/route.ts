import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiFail, ApiError, badRequest, preflight } from "@/server/http";
import { readMediaObject } from "@/server/modules/shared/assets";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/media/{key} - alirkan satu berkas dari Cloudflare R2.
 *
 * Key boleh mengandung garis miring, mis. `/api/v1/media/soal/2026/gambar.png`.
 * Response-nya berupa byte, bukan JSON, jadi tidak memakai amplop v1 -
 * kegagalannya saja yang tetap berbentuk JSON standar.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ key: string[] }> }) {
  const { key: segments } = await ctx.params;
  const key = segments.map(decodeURIComponent).join("/");

  if (!key) return apiFail(badRequest("Key berkas wajib diisi", "VALIDATION_ERROR"));

  try {
    const result = await readMediaObject(key);

    if (result.state === "NOT_CONFIGURED") {
      return apiFail(new ApiError(503, "MEDIA_NOT_CONFIGURED", "Penyimpanan media belum diatur"));
    }
    if (result.state === "NOT_FOUND") {
      return apiFail(new ApiError(404, "NOT_FOUND", "Berkas tidak ditemukan"));
    }

    const headers = new Headers();
    if (result.contentType) headers.set("Content-Type", result.contentType);
    if (result.contentLength) headers.set("Content-Length", String(result.contentLength));
    // Berkas media tidak pernah berubah isinya untuk key yang sama.
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(result.body, { headers });
  } catch {
    return apiFail(new ApiError(500, "INTERNAL_ERROR", "Gagal mengambil berkas"));
  }
}

export async function OPTIONS() {
  return preflight();
}
