import {
  Sparkles, Tent, Trophy, Volleyball, Flag, Moon, Languages, Music, HeartPulse, type LucideIcon,
} from "lucide-react";
import { EXTRACURRICULARS } from "@/lib/landing-static";
import { RevealContainer, RevealCard } from "@/components/landing/Reveal";

export const metadata = { title: "Ekstrakurikuler – SMK Hutama" };

const ICONS: Record<string, LucideIcon> = {
  Tent, Trophy, Volleyball, Flag, Moon, Languages, Music, Sparkles, HeartPulse,
};

export default function EkstrakurikulerPage() {
  return (
    <>
      <section className="relative overflow-hidden mesh-bg text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-float-slow absolute -left-16 top-0 h-56 w-56 rounded-full bg-blue-400/30 blur-3xl" />
          <div className="animate-float-slower absolute right-0 bottom-0 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pt-28 pb-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl glass">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">Ekstrakurikuler</h1>
          <p className="mx-auto mt-3 max-w-lg text-blue-100">
            Kembangkan bakat, minat, dan karakter melalui beragam kegiatan ekstrakurikuler.
          </p>
        </div>
        <svg viewBox="0 0 1440 80" className="block w-full" preserveAspectRatio="none">
          <path fill="white" className="fill-slate-50 dark:fill-slate-900" d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </section>

      <section className="bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <RevealContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {EXTRACURRICULARS.map((e, i) => {
              const Icon = ICONS[e.icon] ?? Sparkles;
              return (
                <RevealCard key={i}>
                  <div className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl h-full">
                    <div className="relative h-44 overflow-hidden">
                      {e.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.image} alt={e.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                      ) : (
                        <div className={`h-full w-full bg-gradient-to-br ${e.color}`} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className={`absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${e.color} shadow-lg`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700">
                        {e.category}
                      </span>
                      <h3 className="absolute bottom-3 left-4 font-heading text-lg font-bold text-white">{e.name}</h3>
                    </div>
                    <div className="flex flex-col flex-1 p-5">
                      <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 flex-1">{e.description}</p>
                      <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-400">
                        <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                        {e.schedule}
                      </div>
                    </div>
                  </div>
                </RevealCard>
              );
            })}
          </RevealContainer>
        </div>
      </section>
    </>
  );
}
