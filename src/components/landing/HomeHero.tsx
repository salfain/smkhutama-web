"use client";

import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { LogIn, ArrowRight, Sparkles } from "lucide-react";
import { RevealContainer, RevealItem, RevealImage } from "./Reveal";

type Props = {
  badge?: string | null;
  title?: string | null;
  subtitle?: string | null;
  images: { imageUrl: string; caption?: string | null }[];
};

export function HomeHero({ badge, title, subtitle, images }: Props) {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3500, stopOnInteraction: false }),
  ]);

  return (
    <section id="beranda" className="relative min-h-[calc(100vh-64px)] overflow-hidden mesh-bg text-white flex items-center">
      {/* Floating blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-float-slow absolute -left-20 top-10 h-72 w-72 rounded-full bg-blue-400/30 blur-3xl" />
        <div className="animate-float-slower absolute right-0 top-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="animate-float-slow absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
      </div>
      <div className="noise-overlay absolute inset-0" />

      <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-16">
        <RevealContainer className="flex flex-col items-center gap-10 md:flex-row">
          <RevealItem className="flex-1 space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full glass px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-blue-100">
              <Sparkles className="h-3.5 w-3.5" />
              {badge ?? "SMK HUTAMA"}
            </span>
            <h1 className="font-heading text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
              {title ?? "Mempersiapkan generasi yang siap bersaing di dunia kerja."}
            </h1>
            <p className="max-w-lg text-base text-blue-100/90 md:text-lg">
              {subtitle ?? "Lingkungan belajar modern dengan program keahlian unggulan."}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/ppdb">
                <Button size="lg" className="group gap-2 rounded-full bg-white px-7 font-semibold text-blue-700 hover:bg-blue-50 shine">
                  Daftar Sekarang
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="gap-2 rounded-full border-white/30 glass px-7 text-white hover:bg-white/15">
                  <LogIn className="h-4 w-4" />Login CBT
                </Button>
              </Link>
            </div>
          </RevealItem>

          <RevealImage className="w-full max-w-md flex-1">
            <div className="rounded-[28px] glass p-2.5 shadow-2xl">
              <div className="overflow-hidden rounded-[20px]" ref={emblaRef}>
                <div className="flex">
                  {images.map((image, i) => (
                    <div key={i} className="min-w-0 flex-[0_0_100%]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.imageUrl} alt={image.caption ?? "Dokumentasi SMK Hutama"}
                        className="h-64 w-full object-cover md:h-80" loading={i === 0 ? "eager" : "lazy"} />
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-2 text-center text-[10px] text-blue-100/70">Dokumentasi SMK Hutama</p>
            </div>
          </RevealImage>
        </RevealContainer>
      </div>

      {/* Wave divider */}
      <div className="relative">
        <svg viewBox="0 0 1440 80" className="block w-full" preserveAspectRatio="none">
          <path fill="#f8fafc" d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </div>
    </section>
  );
}
