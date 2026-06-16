import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Newspaper } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const news = await prisma.landingNews.findUnique({ where: { slug } });
  if (!news) return { title: "Berita Tidak Ditemukan" };
  return { title: `${news.title} – SMK Hutama` };
}

export default async function BeritaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const news = await prisma.landingNews.findUnique({ where: { slug } });
  if (!news || !news.isPublished) notFound();

  // Ambil berita lain untuk sidebar
  const related = await prisma.landingNews.findMany({
    where: { isPublished: true, id: { not: news.id } },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden mesh-bg text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-float-slow absolute -left-16 top-0 h-56 w-56 rounded-full bg-blue-400/30 blur-3xl" />
          <div className="animate-float-slower absolute right-0 bottom-0 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pt-28 pb-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl glass">
            <Newspaper className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl max-w-3xl mx-auto leading-tight">
            {news.title}
          </h1>
          <div className="mt-4 flex items-center justify-center gap-2 text-blue-100 text-sm">
            <Calendar className="h-4 w-4" />
            <time>
              {new Date(news.publishedAt).toLocaleDateString("id-ID", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </time>
          </div>
        </div>
        <svg viewBox="0 0 1440 80" className="block w-full" preserveAspectRatio="none">
          <path fill="var(--color-berita-bg, white)" className="fill-white dark:fill-slate-900" d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </section>

      {/* Content */}
      <section className="bg-white dark:bg-slate-900 pb-16">
        <div className="mx-auto max-w-6xl px-4">
          <Link href="/berita" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Berita
          </Link>

          <div className="grid gap-10 lg:grid-cols-3">
            {/* Main Content */}
            <article className="lg:col-span-2">
              {news.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={news.imageUrl}
                  alt={news.title}
                  className="w-full h-64 md:h-80 object-cover rounded-2xl shadow-lg mb-8"
                />
              )}
              <div
                className="news-content max-w-none text-slate-700 dark:text-slate-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: news.content || news.excerpt }}
              />
            </article>

            {/* Sidebar - Berita Lainnya */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6">
                <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white mb-4">
                  Berita Lainnya
                </h3>
                {related.length === 0 ? (
                  <p className="text-sm text-slate-400">Belum ada berita lain.</p>
                ) : (
                  <div className="space-y-4">
                    {related.map((item) => (
                      <Link key={item.id} href={`/berita/${item.slug}`} className="group block">
                        <div className="flex gap-3">
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} alt={item.title} className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                              <Newspaper className="h-5 w-5 text-white/60" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 line-clamp-2 group-hover:text-blue-600 transition-colors">
                              {item.title}
                            </h4>
                            <time className="text-[11px] text-slate-400 mt-1 block">
                              {new Date(item.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </time>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
