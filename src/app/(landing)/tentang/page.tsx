import { getAbout } from "@/server/modules/landing/content";
import { Building2, Target, ListChecks, Quote, History } from "lucide-react";
import { PageHero } from "@/components/landing/PageHero";

export const dynamic = "force-dynamic";

export const metadata = { title: "Tentang Kami – SMK Hutama" };

export default async function TentangPage() {
  const { vision, missionItems, history, principalName, principalPhoto, principalWord } =
    await getAbout();

  return (
    <>
      <PageHero
        icon={Building2}
        title="Tentang SMK Hutama"
        subtitle="Visi, misi, dan sambutan kepala sekolah SMK Hutama Pondok Gede."
      />

      <section className="bg-canvas">
        <div className="mx-auto max-w-5xl px-4 py-16 space-y-10">

          {/* Sambutan Kepala Sekolah */}
          {(principalWord || principalName) && (
            <div className="rounded-3xl border border-hairline bg-surface p-6 shadow-sm md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                {principalPhoto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={principalPhoto} alt={principalName} className="h-40 w-40 shrink-0 rounded-2xl object-cover ring-4 ring-brand-soft dark:ring-brand/20 mx-auto md:mx-0" />
                )}
                <div className="flex-1">
                  <Quote className="h-7 w-7 text-brand-text" />
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft whitespace-pre-wrap">{principalWord}</p>
                  {principalName && (
                    <p className="mt-4 font-heading font-bold text-ink">{principalName}</p>
                  )}
                  <p className="text-xs text-brand-text">Kepala Sekolah</p>
                </div>
              </div>
            </div>
          )}

          {/* Visi & Misi */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-hairline bg-surface p-6 shadow-sm md:p-8">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-strong">
                <Target className="h-5 w-5 text-slate-900" />
              </div>
              <h2 className="font-heading text-xl font-bold text-ink">Visi</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{vision}</p>
            </div>
            <div className="rounded-3xl border border-hairline bg-surface p-6 shadow-sm md:p-8">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-strong">
                <ListChecks className="h-5 w-5 text-slate-900" />
              </div>
              <h2 className="font-heading text-xl font-bold text-ink">Misi</h2>
              <ul className="mt-3 space-y-2">
                {missionItems.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand-text dark:bg-brand/10 dark:text-brand-text">{i + 1}</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sejarah (opsional) */}
          {history && (
            <div className="rounded-3xl border border-hairline bg-surface p-6 shadow-sm md:p-8">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-strong">
                <History className="h-5 w-5 text-slate-900" />
              </div>
              <h2 className="font-heading text-xl font-bold text-ink">Sejarah Singkat</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft whitespace-pre-wrap">{history}</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
