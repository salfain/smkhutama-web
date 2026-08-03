import { listNews } from "@/server/modules/landing/content";
import { Newspaper } from "lucide-react";
import { NewsGrid } from "@/components/landing/NewsGrid";
import { PageHero } from "@/components/landing/PageHero";

export const dynamic = "force-dynamic";

export const metadata = { title: "Berita & Kegiatan – SMK Hutama" };

export default async function BeritaPage() {
  const news = await listNews();

  return (
    <>
      <PageHero
        icon={Newspaper}
        title="Berita & Kegiatan"
        subtitle="Informasi terbaru seputar kegiatan belajar, prestasi, dan acara SMK Hutama."
      />

      <section className="bg-canvas-alt py-16">
        <div className="mx-auto max-w-6xl px-4">
          {news.length === 0 ? (
            <p className="text-center text-ink-soft">Belum ada berita.</p>
          ) : (
            <NewsGrid news={news} />
          )}
        </div>
      </section>
    </>
  );
}
