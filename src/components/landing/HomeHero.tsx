"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { RevealContainer, RevealItem, RevealImage } from "./Reveal";

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
    <section id="beranda" className="relative overflow-hidden bg-[#f8fafc] text-slate-900 dark:bg-[#0a0a0f] dark:text-white">
      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 text-slate-900 opacity-[0.05] dark:text-white dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Sky glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-sky-500/20 blur-[120px] dark:bg-sky-500/20" />
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -right-20 top-40 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 pt-28 pb-0 text-center md:pt-32">
        <RevealContainer className="flex flex-col items-center">
          <RevealItem>
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-400/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-600 dark:border-sky-400/30 dark:text-sky-300">
              <Sparkles className="h-3.5 w-3.5" />
              {badge ?? "SMK HUTAMA PONDOK GEDE"}
            </span>
          </RevealItem>

          <RevealItem>
            <h1 className="mt-6 font-heading text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              {title ?? (
                <>
                  Cetak Generasi{" "}
                  <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-sky-600 bg-clip-text text-transparent dark:from-sky-300 dark:via-blue-400 dark:to-sky-500">
                    Unggul & Berdaya Saing
                  </span>
                </>
              )}
            </h1>
          </RevealItem>

          <RevealItem>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 md:text-base">
              {subtitle ?? "Di SMK Hutama, kami percaya pada kekuatan pendidikan vokasi. Lingkungan belajar modern, religius, dan disiplin dengan program keahlian unggulan serta kemitraan industri."}
            </p>
          </RevealItem>

          <RevealItem className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/ppdb">
              <Button size="lg" className="group gap-2 rounded-full bg-sky-400 px-7 font-semibold text-slate-900 shadow-lg shadow-sky-500/25 hover:bg-sky-300">
                Daftar Sekarang
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="gap-2 rounded-full border-slate-300 bg-white/90 px-7 text-slate-800 hover:bg-slate-100 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                <LogIn className="h-4 w-4" />Login
              </Button>
            </Link>
          </RevealItem>
        </RevealContainer>

        {/* Fanned image cards with Stagger Entrance and Hover Interactions */}
        {pics.length > 0 && (
          <RevealContainer
            stagger={0.12}
            delayChildren={0.2}
            className="relative mt-14 flex items-end justify-center md:mt-16"
          >
            {pics.map((src, i) => {
              const baseRotate = i === 0 ? -10 : i === 2 ? 10 : 0;
              return (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 30, scale: 0.85, rotate: baseRotate },
                    visible: {
                      opacity: 1, y: 0, scale: 1, rotate: baseRotate,
                      transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }
                    }
                  }}
                  whileHover={{
                    scale: 1.06,
                    y: -12,
                    rotate: i === 0 ? -12 : i === 2 ? 12 : 0,
                    zIndex: 40,
                    transition: { duration: 0.2, ease: "easeOut" }
                  }}
                  className={`relative ${cardPos[i]} cursor-pointer`}
                  style={{
                    marginLeft: i === 0 ? 0 : "-3rem",
                    marginRight: i === 2 ? 0 : "-3rem",
                  }}
                >
                  <div className="overflow-hidden rounded-3xl bg-gradient-to-b from-sky-300 to-blue-500 p-1.5 shadow-2xl shadow-sky-900/40 ring-1 ring-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt="Dokumentasi SMK Hutama"
                      className="h-56 w-40 rounded-[18px] object-cover md:h-80 md:w-60"
                      loading={i === 1 ? "eager" : "lazy"}
                    />
                  </div>
                </motion.div>
              );
            })}
            {/* fade bottom into next section */}
            <div className="pointer-events-none absolute -bottom-1 left-0 right-0 h-24 bg-gradient-to-t from-[#f8fafc] to-transparent dark:from-[#0a0a0f]" />
          </RevealContainer>
        )}

        {/* Stat strip */}
        {stats.length > 0 && (
          <RevealContainer className="relative z-30 mt-8 grid grid-cols-2 gap-3 pb-12 sm:grid-cols-4">
            {stats.slice(0, 4).map((s) => (
              <RevealItem key={s.id} className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none dark:backdrop-blur">
                <div className="font-heading text-2xl font-bold text-sky-500 dark:text-sky-300 md:text-3xl">{s.value}</div>
                <div className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">{s.label}</div>
              </RevealItem>
            ))}
          </RevealContainer>
        )}
      </div>
    </section>
  );
}
