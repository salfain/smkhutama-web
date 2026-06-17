"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { LogIn, ArrowRight, Sparkles, GraduationCap, Briefcase, ChevronDown, CheckCircle2 } from "lucide-react";
import { RevealContainer, RevealItem, RevealImage } from "./Reveal";

type Stat = { id: string; label: string; value: string };
type Props = {
  badge?: string | null;
  title?: string | null;
  subtitle?: string | null;
  images: { imageUrl: string; caption?: string | null }[];
  stats?: Stat[];
};

const FEATURES = ["Religius & Disiplin", "Kemitraan Industri", "Guru Profesional"];

export function HomeHero({ badge, title, subtitle, images, stats = [] }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 4000, stopOnInteraction: false }),
  ]);
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (!emblaApi) return;
    setSnaps(emblaApi.scrollSnapList());
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  const topStats = stats.slice(0, 2);

  return (
    <section id="beranda" className="relative min-h-[calc(100vh-64px)] overflow-hidden mesh-bg text-white flex items-center">
      {/* Floating blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-float-slow absolute -left-20 top-10 h-72 w-72 rounded-full bg-blue-400/30 blur-3xl" />
        <div className="animate-float-slower absolute right-0 top-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="animate-float-slow absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
      </div>
      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent)",
        }}
      />
      <div className="noise-overlay absolute inset-0" />

      <div className="relative mx-auto max-w-6xl px-4 py-14 md:py-20">
        <RevealContainer className="flex flex-col items-center gap-12 md:flex-row">
          <RevealItem className="flex-1 space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-50">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              {badge ?? "SMK HUTAMA PONDOK GEDE"}
            </span>

            <h1 className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl lg:text-[3.5rem]">
              {title ?? (
                <>
                  Mempersiapkan generasi{" "}
                  <span className="bg-gradient-to-r from-sky-300 via-blue-200 to-indigo-300 bg-clip-text text-transparent">
                    siap kerja & siap kuliah
                  </span>
                </>
              )}
            </h1>

            <p className="max-w-lg text-base leading-relaxed text-blue-100/90 md:text-lg">
              {subtitle ?? "Lingkungan belajar modern, religius, dan disiplin dengan program keahlian unggulan serta kemitraan industri."}
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
              {FEATURES.map((f) => (
                <span key={f} className="inline-flex items-center gap-1.5 text-sm text-blue-50/90">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />{f}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-3">
              <Link href="/ppdb">
                <Button size="lg" className="group gap-2 rounded-full bg-white px-7 font-semibold text-blue-700 shadow-lg shadow-blue-900/20 hover:bg-blue-50 shine">
                  Daftar Sekarang
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="gap-2 rounded-full border-white/30 glass px-7 text-white hover:bg-white/15">
                  <LogIn className="h-4 w-4" />Login
                </Button>
              </Link>
            </div>
          </RevealItem>

          <RevealImage className="w-full max-w-md flex-1">
            <div className="relative">
              {/* Glow behind */}
              <div className="absolute -inset-4 rounded-[36px] bg-gradient-to-tr from-blue-500/20 to-indigo-400/20 blur-2xl" />

              <div className="relative rounded-[28px] glass p-2.5 shadow-2xl">
                <div className="overflow-hidden rounded-[20px]" ref={emblaRef}>
                  <div className="flex">
                    {images.map((image, i) => (
                      <div key={i} className="min-w-0 flex-[0_0_100%]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.imageUrl} alt={image.caption ?? "Dokumentasi SMK Hutama"}
                          className="h-72 w-full object-cover md:h-[26rem]" loading={i === 0 ? "eager" : "lazy"} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dots */}
                {snaps.length > 1 && (
                  <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-1.5">
                    {snaps.map((_, i) => (
                      <button key={i} onClick={() => scrollTo(i)} aria-label={`Slide ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all ${i === selected ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`} />
                    ))}
                  </div>
                )}
              </div>

              {/* Floating stat card — top */}
              <div className="absolute -left-4 top-6 hidden animate-float-slow rounded-2xl glass-light px-4 py-3 shadow-xl sm:block">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold leading-none text-slate-900">{topStats[0]?.value ?? "A"}</p>
                    <p className="text-[10px] font-medium text-slate-500">{topStats[0]?.label ?? "Akreditasi"}</p>
                  </div>
                </div>
              </div>

              {/* Floating stat card — bottom */}
              <div className="absolute -right-4 bottom-10 hidden animate-float-slower rounded-2xl glass-light px-4 py-3 shadow-xl sm:block">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                    <Briefcase className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold leading-none text-slate-900">{topStats[1]?.value ?? "20+"}</p>
                    <p className="text-[10px] font-medium text-slate-500">{topStats[1]?.label ?? "Mitra Industri"}</p>
                  </div>
                </div>
              </div>
            </div>
          </RevealImage>
        </RevealContainer>

        {/* Scroll indicator */}
        <div className="mt-12 hidden justify-center md:flex">
          <div className="flex flex-col items-center gap-1.5 text-blue-100/60">
            <span className="text-[10px] uppercase tracking-[0.3em]">Gulir</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="relative">
        <svg viewBox="0 0 1440 80" className="block w-full" preserveAspectRatio="none">
          <path fill="#f8fafc" className="dark:fill-slate-900" d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </div>
    </section>
  );
}
