import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TEACHERS, type Teacher } from "@/lib/landing-static";
import { RevealContainer, RevealCard } from "@/components/landing/Reveal";
import { PageHero } from "@/components/landing/PageHero";

export const dynamic = "force-dynamic";

export const metadata = { title: "Data Guru & Tenaga Pendidik – SMK Hutama" };

export default async function GuruPage() {
  const rows = await prisma.landingTeacher
    .findMany({ where: { isActive: true }, orderBy: { orderNumber: "asc" } })
    .catch(() => []);

  const teachers: Teacher[] = rows.length > 0
    ? rows.map((t) => ({ name: t.name, position: t.position, subject: t.subject ?? "", photo: t.photoUrl }))
    : TEACHERS;

  return (
    <>
      <PageHero
        icon={Users}
        title="Guru & Tenaga Pendidik"
        subtitle="Tim pengajar profesional dan berpengalaman yang siap membimbing siswa meraih prestasi."
      />

      <section className="bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <RevealContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {teachers.map((t, i) => (
              <RevealCard key={i}>
                <div className="group flex flex-col items-center rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-center shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl h-full">
                  <div className="relative">
                    {t.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.photo} alt={t.name} className="h-24 w-24 rounded-full object-cover ring-4 ring-amber-100 dark:ring-amber-400/20 transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-2xl font-bold text-slate-900 ring-4 ring-amber-100">
                        {t.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white leading-snug">{t.name}</h3>
                  <span className="mt-2 inline-block rounded-full bg-amber-100 dark:bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                    {t.position}
                  </span>
                  {t.subject && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t.subject}</p>}
                </div>
              </RevealCard>
            ))}
          </RevealContainer>
        </div>
      </section>
    </>
  );
}
