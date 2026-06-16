import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TEACHERS, type Teacher } from "@/lib/landing-static";
import { RevealContainer, RevealCard } from "@/components/landing/Reveal";

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
      <section className="relative overflow-hidden mesh-bg text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-float-slow absolute -left-16 top-0 h-56 w-56 rounded-full bg-blue-400/30 blur-3xl" />
          <div className="animate-float-slower absolute right-0 bottom-0 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pt-28 pb-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl glass">
            <Users className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">Guru & Tenaga Pendidik</h1>
          <p className="mx-auto mt-3 max-w-lg text-blue-100">
            Tim pengajar profesional dan berpengalaman yang siap membimbing siswa meraih prestasi.
          </p>
        </div>
        <svg viewBox="0 0 1440 80" className="block w-full" preserveAspectRatio="none">
          <path fill="white" className="fill-slate-50 dark:fill-slate-900" d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </section>

      <section className="bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <RevealContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {teachers.map((t, i) => (
              <RevealCard key={i}>
                <div className="group flex flex-col items-center rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-center shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl h-full">
                  <div className="relative">
                    {t.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.photo} alt={t.name} className="h-24 w-24 rounded-full object-cover ring-4 ring-blue-100 dark:ring-blue-900/40 transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white ring-4 ring-blue-100">
                        {t.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white leading-snug">{t.name}</h3>
                  <span className="mt-2 inline-block rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
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
