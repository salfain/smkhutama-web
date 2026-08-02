import type { NextRequest } from "next/server";
import { apiOk, handle, notFound, preflight } from "@/server/http";
import { getNewsBySlug, listRelatedNews } from "@/server/modules/landing/content";
import { toNews, toNewsDetail } from "@/server/modules/landing/dto";

/**
 * GET /api/v1/landing/news/{slug} — satu berita beserta isinya dan beberapa
 * berita lain. Publik. Berita yang belum terbit dianggap tidak ada.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  return handle(async () => {
    const { slug } = await ctx.params;

    const news = await getNewsBySlug(slug);
    if (!news) throw notFound("Berita tidak ditemukan", "NEWS_NOT_FOUND");

    const related = await listRelatedNews(slug);
    return apiOk({ ...toNewsDetail(news), related: related.map(toNews) });
  });
}

export async function OPTIONS() {
  return preflight();
}
