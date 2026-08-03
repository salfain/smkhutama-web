import { Users } from "lucide-react";
import { type Teacher } from "@/lib/landing-static";
import { listTeachers } from "@/server/modules/landing/content";
import { RevealContainer, RevealCard } from "@/components/landing/Reveal";
import { PageHero } from "@/components/landing/PageHero";

export const dynamic = "force-dynamic";

export const metadata = { title: "Data Guru & Tenaga Pendidik – SMK Hutama" };

export default async function GuruPage() {
  const teachers: Teacher[] = await listTeachers();

  return (
    <>
      <PageHero
        icon={Users}
        title="Guru & Tenaga Pendidik"
        subtitle="Tim pengajar profesional dan berpengalaman yang siap membimbing siswa meraih prestasi."
      />

      <section className="bg-canvas">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <RevealContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {teachers.map((t, i) => (
              <RevealCard key={i}>
                <div className="group flex flex-col items-center rounded-3xl border border-hairline bg-surface p-6 text-center shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl h-full">
                  <div className="relative">
                    {t.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.photo} alt={t.name} className="h-24 w-24 rounded-full object-cover ring-4 ring-brand-soft dark:ring-brand/20 transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-strong text-2xl font-bold text-slate-900 ring-4 ring-brand-soft">
                        {t.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-ink leading-snug">{t.name}</h3>
                  <span className="mt-2 inline-block rounded-full bg-brand-soft px-3 py-1 text-[11px] font-semibold text-brand-text">
                    {t.position}
                  </span>
                  {t.subject && <p className="mt-2 text-xs text-ink-soft">{t.subject}</p>}
                </div>
              </RevealCard>
            ))}
          </RevealContainer>
        </div>
      </section>
    </>
  );
}
