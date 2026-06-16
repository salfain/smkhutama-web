import { HomeNews } from "@/components/landing/HomeSections";
import { getLandingContent } from "@/lib/landing-data";
import { Newspaper } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Berita & Kegiatan – SMK Hutama" };

export default async function BeritaPage() {
  const { news } = await getLandingContent().catch(() => ({ news: [] }));

  return (
    <>
      <section className="relative overflow-hidden mesh-bg text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-float-slow absolute -left-16 top-0 h-56 w-56 rounded-full bg-blue-400/30 blur-3xl" />
          <div className="animate-float-slower absolute right-0 bottom-0 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pt-28 pb-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl glass">
            <Newspaper className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">Berita & Kegiatan</h1>
          <p className="mx-auto mt-3 max-w-lg text-blue-100">
            Informasi terbaru seputar kegiatan belajar, prestasi, dan acara SMK Hutama.
          </p>
        </div>
        <svg viewBox="0 0 1440 80" className="block w-full" preserveAspectRatio="none">
          <path fill="white" d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </section>
      <HomeNews news={news} />
    </>
  );
}
