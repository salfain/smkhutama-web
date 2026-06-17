import { prisma } from "@/lib/prisma";
import { Building2, Target, ListChecks, Quote, History } from "lucide-react";
import { PageHero } from "@/components/landing/PageHero";

export const dynamic = "force-dynamic";

export const metadata = { title: "Tentang Kami – SMK Hutama" };

export default async function TentangPage() {
  const p = await prisma.landingProfile.findFirst().catch(() => null);

  const vision = p?.vision ?? "Menjadi sekolah menengah kejuruan unggulan yang menghasilkan lulusan berkarakter, kompeten, dan berdaya saing global.";
  const mission = p?.mission ?? "Menyelenggarakan pendidikan vokasi yang religius dan disiplin.\nMembekali siswa dengan keterampilan sesuai kebutuhan industri.\nMembangun kemitraan dengan dunia usaha dan dunia industri (DU/DI).\nMengembangkan karakter, kemandirian, dan jiwa wirausaha siswa.";
  const history = p?.history ?? "";
  const principalName = p?.principalName ?? "";
  const principalPhoto = p?.principalPhoto ?? "";
  const principalWord = p?.principalWord ?? "";

  const missionItems = mission.split("\n").map((m) => m.trim()).filter(Boolean);

  return (
    <>
      <PageHero
        icon={Building2}
        title="Tentang SMK Hutama"
        subtitle="Visi, misi, dan sambutan kepala sekolah SMK Hutama Pondok Gede."
      />

      <section className="bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-16 space-y-10">

          {/* Sambutan Kepala Sekolah */}
          {(principalWord || principalName) && (
            <div className="rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                {principalPhoto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={principalPhoto} alt={principalName} className="h-40 w-40 shrink-0 rounded-2xl object-cover ring-4 ring-amber-100 dark:ring-amber-400/20 mx-auto md:mx-0" />
                )}
                <div className="flex-1">
                  <Quote className="h-7 w-7 text-amber-400" />
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{principalWord}</p>
                  {principalName && (
                    <p className="mt-4 font-heading font-bold text-slate-900 dark:text-white">{principalName}</p>
                  )}
                  <p className="text-xs text-amber-600 dark:text-amber-400">Kepala Sekolah</p>
                </div>
              </div>
            </div>
          )}

          {/* Visi & Misi */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm md:p-8">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
                <Target className="h-5 w-5 text-slate-900" />
              </div>
              <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-white">Visi</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{vision}</p>
            </div>
            <div className="rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm md:p-8">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
                <ListChecks className="h-5 w-5 text-slate-900" />
              </div>
              <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-white">Misi</h2>
              <ul className="mt-3 space-y-2">
                {missionItems.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">{i + 1}</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sejarah (opsional) */}
          {history && (
            <div className="rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm md:p-8">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
                <History className="h-5 w-5 text-slate-900" />
              </div>
              <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-white">Sejarah Singkat</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{history}</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
