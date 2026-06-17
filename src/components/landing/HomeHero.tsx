"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, LogIn } from "lucide-react";
import { RevealContainer, RevealItem } from "./Reveal";

type Stat = { id: string; label: string; value: string };
type Props = {
  badge?: string | null;
  title?: string | null;
  subtitle?: string | null;
  images: { imageUrl: string; caption?: string | null }[];
  stats?: Stat[];
};

export function HomeHero({ badge, title, subtitle, images, stats = [] }: Props) {
  // Susun 3 kartu kipas; jika gambar kurang, ulangi yang ada.
  const pics = images.length > 0
    ? [0, 1, 2].map((i) => images[i % images.length]?.imageUrl).filter(Boolean) as string[]
    : [];

  const cardPos = [
    "z-10 -rotate-[10deg] -translate-x-4 translate-y-8 md:-translate-x-10 md:translate-y-10 scale-[0.86]",
    "z-20 translate-y-0 scale-100",
    "z-10 rotate-[10deg] translate-x-4 translate-y-8 md:translate-x-10 md:translate-y-10 scale-[0.86]",
  ];

  return (
    <section id="beranda" className="relative overflow-hidden bg-[#0a0a0f] text-white">
      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Amber glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-amber-500/20 blur-[120px]" />
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-orange-600/10 blur-3xl" />
        <div className="absolute -right-20 top-40 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 pt-28 pb-0 text-center md:pt-32">
        <RevealContainer className="flex flex-col items-center">
          <RevealItem>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              {badge ?? "SMK HUTAMA PONDOK GEDE"}
            </span>
          </RevealItem>

          <RevealItem>
            <h1 className="mt-6 font-heading text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              {title ?? (
                <>
                  Cetak Generasi{" "}
                  <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                    Unggul & Berdaya Saing
                  </span>
                </>
              )}
            </h1>
          </RevealItem>

          <RevealItem>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-400 md:text-base">
              {subtitle ?? "Di SMK Hutama, kami percaya pada kekuatan pendidikan vokasi. Lingkungan belajar modern, religius, dan disiplin dengan program keahlian unggulan serta kemitraan industri."}
            </p>
          </RevealItem>

          <RevealItem className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/ppdb">
              <Button size="lg" className="group gap-2 rounded-full bg-amber-400 px-7 font-semibold text-slate-900 shadow-lg shadow-amber-500/25 hover:bg-amber-300">
                Daftar Sekarang
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="gap-2 rounded-full border-white/20 bg-white/5 px-7 text-white hover:bg-white/10">
                <LogIn className="h-4 w-4" />Login
              </Button>
            </Link>
          </RevealItem>
        </RevealContainer>

        {/* Fanned image cards */}
        {pics.length > 0 && (
          <div className="relative mt-14 flex items-end justify-center md:mt-16">
            {pics.map((src, i) => (
              <div
                key={i}
                className={`relative ${cardPos[i]} transition-transform duration-500`}
                style={{ marginLeft: i === 0 ? 0 : "-3rem", marginRight: i === 2 ? 0 : "-3rem" }}
              >
                <div className="overflow-hidden rounded-3xl bg-gradient-to-b from-amber-300 to-orange-500 p-1.5 shadow-2xl shadow-amber-900/40 ring-1 ring-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt="Dokumentasi SMK Hutama"
                    className="h-56 w-40 rounded-[18px] object-cover md:h-80 md:w-60"
                    loading={i === 1 ? "eager" : "lazy"}
                  />
                </div>
              </div>
            ))}
            {/* fade bottom into next section */}
            <div className="pointer-events-none absolute -bottom-1 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
          </div>
        )}

        {/* Stat strip */}
        {stats.length > 0 && (
          <RevealContainer className="relative z-30 mt-8 grid grid-cols-2 gap-3 pb-12 sm:grid-cols-4">
            {stats.slice(0, 4).map((s) => (
              <RevealItem key={s.id} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4 backdrop-blur">
                <div className="font-heading text-2xl font-bold text-amber-300 md:text-3xl">{s.value}</div>
                <div className="mt-1 text-[11px] font-medium text-slate-400">{s.label}</div>
              </RevealItem>
            ))}
          </RevealContainer>
        )}
      </div>
    </section>
  );
}
