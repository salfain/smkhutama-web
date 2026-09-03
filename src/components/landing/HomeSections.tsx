"use client";

import Link from "next/link";
import { ArrowUpRight, GraduationCap, Newspaper } from "lucide-react";
import { RevealContainer, RevealItem, RevealCard } from "./Reveal";

type Stat = { id: string; label: string; value: string };
type Major = { id: string; code: string; name: string; description: string };
type News = { id: string; slug: string; title: string; excerpt: string; publishedAt: Date | string; imageUrl?: string | null };

export function HomeStats({ stats }: { stats: Stat[] }) {
  return (
    <section className="relative -mt-2 bg-canvas">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <RevealContainer className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <RevealCard key={s.id}
              className="group rounded-3xl border border-white bg-white/70 px-4 py-6 text-center shadow-sm backdrop-blur transition-all dark:border-white/10 dark:bg-white/5">
              <div className="font-heading text-3xl font-bold text-gradient md:text-4xl">{s.value}</div>
              <div className="mt-1.5 text-xs font-medium text-ink-soft">{s.label}</div>
            </RevealCard>
          ))}
        </RevealContainer>
      </div>
    </section>
  );
}

export function HomeMajors({
  majors,
  showHeader = true,
  moreHref,
}: {
  majors: Major[];
  /** Matikan saat halaman sudah punya judulnya sendiri (mis. PageHero di /jurusan). */
  showHeader?: boolean;
  /** Tampilkan tautan "lihat semua" di bawah daftar. */
  moreHref?: string;
}) {
  return (
    <section id="jurusan" className="bg-canvas">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <RevealContainer>
          {showHeader && (
            <RevealItem className="mb-10 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-text dark:bg-brand/10 dark:text-brand-text">
                <GraduationCap className="h-3.5 w-3.5" />Program Keahlian
              </span>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-ink md:text-4xl">
                Jurusan Unggulan
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
                Link & match dengan kebutuhan industri dan perguruan tinggi.
              </p>
            </RevealItem>
          )}
          <div className="grid gap-5 md:grid-cols-3">
            {majors.map((m, i) => (
              <RevealCard key={m.id}
                className="group relative overflow-hidden rounded-3xl border border-hairline bg-surface p-6 shadow-sm transition-all">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-brand to-brand-soft dark:from-brand/10 dark:to-brand-strong/10 opacity-60 transition-transform group-hover:scale-150" />
                <div className="relative">
                  <span className="inline-block rounded-xl bg-chip px-3 py-1 text-xs font-bold text-chip-ink ring-1 ring-brand/25">
                    {m.code}
                  </span>
                  <h3 className="mt-4 text-base font-bold text-ink">{m.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{m.description}</p>
                  <span className="mt-4 inline-block text-xs font-semibold text-brand-text">0{i + 1}</span>
                </div>
              </RevealCard>
            ))}
          </div>
          {moreHref && (
            <RevealItem className="mt-8 text-center">
              <Link href={moreHref} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-text hover:underline dark:text-brand-text">
                Lihat detail program keahlian <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </RevealItem>
          )}
        </RevealContainer>
      </div>
    </section>
  );
}

export function HomeNews({ news }: { news: News[] }) {
  return (
    <section id="berita" className="bg-canvas-alt">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <RevealContainer>
          <RevealItem className="mb-10 flex items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-text">
                <Newspaper className="h-3.5 w-3.5" />Berita
              </span>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-ink md:text-4xl">
                Kegiatan Terbaru
              </h2>
            </div>
            <Link href="/berita" className="text-sm font-semibold text-brand-text hover:underline hidden md:block">
              Lihat Semua →
            </Link>
          </RevealItem>
          {news.length === 0 ? (
            <p className="text-sm text-ink-soft">Belum ada berita.</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {news.slice(0, 3).map((item) => (
                <RevealCard key={item.id}>
                  <Link href={`/berita/${item.slug}`}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-hairline bg-surface shadow-sm transition-all h-full">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.title} className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-anchor-soft to-anchor">
                        <Newspaper className="h-10 w-10 text-white/40" />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      <time className="text-[11px] font-medium text-ink-soft">
                        {new Date(item.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </time>
                      <h3 className="mt-1.5 line-clamp-2 font-bold text-ink transition-colors group-hover:text-brand-text dark:group-hover:text-brand-text">
                        {item.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft flex-1">{item.excerpt}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-text">
                        Selengkapnya <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    </div>
                  </Link>
                </RevealCard>
              ))}
            </div>
          )}
          <Link href="/berita" className="mt-8 block text-center text-sm font-semibold text-brand-text hover:underline md:hidden">
            Lihat Semua Berita →
          </Link>
        </RevealContainer>
      </div>
    </section>
  );
}
