import type { NextRequest } from "next/server";
import { apiOk, handle, preflight } from "@/server/http";
import { listNews } from "@/server/modules/landing/content";
import { toNews } from "@/server/modules/landing/dto";

/**
 * GET /api/v1/landing/news?take=6 — berita terbit, terbaru dulu. Publik.
 * Tanpa `take`, seluruh berita dikirim; isi lengkapnya ada di endpoint detail.
 */
export async function GET(req: NextRequest) {
  return handle(async () => {
    const raw = req.nextUrl.searchParams.get("take");
    const parsed = raw === null ? NaN : parseInt(raw, 10);
    const take = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;

    const news = await listNews({ take });
    return apiOk(news.map(toNews));
  });
}

export async function OPTIONS() {
  return preflight();
}
