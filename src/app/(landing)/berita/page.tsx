import { prisma } from "@/lib/prisma";
import { Newspaper } from "lucide-react";
import { NewsGrid } from "@/components/landing/NewsGrid";
import { PageHero } from "@/components/landing/PageHero";

export const dynamic = "force-dynamic";

export const metadata = { title: "Berita & Kegiatan – SMK Hutama" };

export default async function BeritaPage() {
  const news = await prisma.landingNews.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <>
      <PageHero
        icon={Newspaper}
        title="Berita & Kegiatan"
        subtitle="Informasi terbaru seputar kegiatan belajar, prestasi, dan acara SMK Hutama."
      />

      <section className="bg-white dark:bg-slate-900 py-16">
        <div className="mx-auto max-w-6xl px-4">
          {news.length === 0 ? (
            <p className="text-center text-slate-400">Belum ada berita.</p>
          ) : (
            <NewsGrid news={news} />
          )}
        </div>
      </section>
    </>
  );
}
