"use client";

import Link from "next/link";
import { ArrowUpRight, GraduationCap, Newspaper } from "lucide-react";
import { RevealContainer, RevealItem, RevealCard } from "./Reveal";

type Stat = { id: string; label: string; value: string };
type Major = { id: string; code: string; name: string; description: string };
type News = { id: string; slug: string; title: string; excerpt: string; publishedAt: Date | string; imageUrl?: string | null };

export function HomeStats({ stats }: { stats: Stat[] }) {
  return (
    <section className="relative -mt-2 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <RevealContainer className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <RevealCard key={s.id}
              className="group rounded-3xl border border-white bg-white/70 px-4 py-6 text-center shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="font-heading text-3xl font-bold text-gradient md:text-4xl">{s.value}</div>
              <div className="mt-1.5 text-xs font-medium text-slate-500">{s.label}</div>
            </RevealCard>
          ))}
        </RevealContainer>
      </div>
    </section>
  );
}

export function HomeMajors({ majors }: { majors: Major[] }) {
  return (
    <section id="jurusan" className="bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <RevealContainer>
          <RevealItem className="mb-10 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
              <GraduationCap className="h-3.5 w-3.5" />Program Keahlian
            </span>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
              Jurusan Unggulan
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Link & match dengan kebutuhan industri dan perguruan tinggi.
            </p>
          </RevealItem>
          <div className="grid gap-5 md:grid-cols-3">
            {majors.map((m, i) => (
              <RevealCard key={m.id}
                className="group relative overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-500/10 dark:to-orange-500/10 opacity-60 transition-transform group-hover:scale-150" />
                <div className="relative">
                  <span className="inline-block rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 px-3 py-1 text-xs font-bold text-slate-900 shadow">
                    {m.code}
                  </span>
                  <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">{m.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{m.description}</p>
                  <span className="mt-4 inline-block text-xs font-semibold text-amber-600 dark:text-amber-400">0{i + 1}</span>
                </div>
              </RevealCard>
            ))}
          </div>
        </RevealContainer>
      </div>
    </section>
  );
}

export function HomeNews({ news }: { news: News[] }) {
  return (
    <section id="berita" className="bg-white dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <RevealContainer>
          <RevealItem className="mb-10 flex items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <Newspaper className="h-3.5 w-3.5" />Berita
              </span>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
                Kegiatan Terbaru
              </h2>
            </div>
            <Link href="/berita" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline hidden md:block">
              Lihat Semua →
            </Link>
          </RevealItem>
          {news.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada berita.</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {news.slice(0, 3).map((item) => (
                <RevealCard key={item.id}>
                  <Link href={`/berita/${item.slug}`}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl h-full">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.title} className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                        <Newspaper className="h-10 w-10 text-white/40" />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      <time className="text-[11px] font-medium text-slate-400">
                        {new Date(item.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </time>
                      <h3 className="mt-1.5 line-clamp-2 font-bold text-slate-900 dark:text-white transition-colors group-hover:text-blue-700 dark:group-hover:text-blue-400">
                        {item.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400 flex-1">{item.excerpt}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        Selengkapnya <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    </div>
                  </Link>
                </RevealCard>
              ))}
            </div>
          )}
          <Link href="/berita" className="mt-8 block text-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline md:hidden">
            Lihat Semua Berita →
          </Link>
        </RevealContainer>
      </div>
    </section>
  );
}
