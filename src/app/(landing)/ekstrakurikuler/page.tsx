import {
  Sparkles, Tent, Trophy, Volleyball, Flag, Moon, Languages, Music, HeartPulse, type LucideIcon,
} from "lucide-react";
import { type Extracurricular } from "@/lib/landing-static";
import { listExtracurriculars } from "@/server/modules/landing/content";
import { RevealContainer, RevealCard } from "@/components/landing/Reveal";
import { PageHero } from "@/components/landing/PageHero";

export const dynamic = "force-dynamic";

export const metadata = { title: "Ekstrakurikuler – SMK Hutama" };

const ICONS: Record<string, LucideIcon> = {
  Tent, Trophy, Volleyball, Flag, Moon, Languages, Music, Sparkles, HeartPulse,
};

export default async function EkstrakurikulerPage() {
  const items: Extracurricular[] = await listExtracurriculars();

  return (
    <>
      <PageHero
        icon={Sparkles}
        title="Ekstrakurikuler"
        subtitle="Kembangkan bakat, minat, dan karakter melalui beragam kegiatan ekstrakurikuler."
      />

      <section className="bg-canvas">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <RevealContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((e, i) => {
              const Icon = ICONS[e.icon] ?? Sparkles;
              return (
                <RevealCard key={i}>
                  <div className="group flex flex-col overflow-hidden rounded-3xl border border-hairline bg-surface shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl h-full">
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
                      <p className="text-sm leading-relaxed text-ink-soft flex-1">{e.description}</p>
                      <div className="mt-4 flex items-center gap-2 text-xs font-medium text-ink-soft">
                        <span className="inline-block h-2 w-2 rounded-full bg-brand" />
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
