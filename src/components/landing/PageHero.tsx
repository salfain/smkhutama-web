"use client";

import type { LucideIcon } from "lucide-react";
import { RevealContainer, RevealItem } from "./Reveal";

export function PageHero({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-[#f8fafc] text-slate-900 dark:bg-[#0a0a0f] dark:text-white">
      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 text-slate-900 opacity-[0.05] dark:text-white dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 70% 80% at 50% 0%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 80% at 50% 0%, black, transparent)",
        }}
      />
      {/* Sky glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-72 w-[36rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-sky-500/20 blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pt-32 pb-16 text-center">
        <RevealContainer className="flex flex-col items-center">
          <RevealItem>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 shadow-lg shadow-sky-500/25">
              <Icon className="h-7 w-7 text-slate-900" />
            </div>
          </RevealItem>
          <RevealItem>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
          </RevealItem>
          {subtitle && (
            <RevealItem>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-500 dark:text-slate-400 md:text-base">
                {subtitle}
              </p>
            </RevealItem>
          )}
        </RevealContainer>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#f8fafc] to-transparent dark:from-[#0a0a0f]" />
    </section>
  );
}
