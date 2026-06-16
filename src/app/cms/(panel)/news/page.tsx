import { getNews } from "../content-actions";
import { NewsClient } from "./NewsClient";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const news = await getNews().catch(() => []);
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Berita & Kegiatan</h1>
        <p className="text-sm text-gray-500">Publikasikan berita yang tampil di beranda</p>
      </div>
      <NewsClient news={news.map((n) => ({
        id: n.id, title: n.title, excerpt: n.excerpt, content: n.content,
        imageUrl: n.imageUrl, isPublished: n.isPublished, publishedAt: n.publishedAt.toISOString(),
      }))} />
    </div>
  );
}
