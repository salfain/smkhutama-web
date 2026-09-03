import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { getSchoolProfile } from "@/server/modules/shared/school";
import { PORTAL_GROUPS, portalPath, portals } from "./portals";
import { getStudentWebLoginEnabled } from "./actions";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Pilih halaman login sesuai peran Anda di SMK Hutama.",
};

export const dynamic = "force-dynamic";

/**
 * Halaman pemilih portal.
 *
 * Formulirnya ada di `/login/{portal}` supaya tautan ke satu pintu bisa
 * dibagikan langsung. Halaman ini sendiri tanpa state, jadi tetap komponen
 * server - sekaligus bisa membaca saklar login siswa tanpa perlu efek klien.
 */
export default async function LoginChooserPage() {
  const [studentLoginEnabled, profile] = await Promise.all([
    getStudentWebLoginEnabled().catch(() => true),
    getSchoolProfile().catch(() => null),
  ]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-5 py-12 dark:bg-[#111113]">
      <div className="w-full max-w-3xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke beranda
        </Link>

        <div className="mb-9 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-[#E8E8EC] bg-[#FFFFFF] dark:border-white/10 dark:bg-[#19191C]">
            {profile?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/api/school/logo" alt="Logo SMK Hutama" className="h-10 w-10 object-contain" />
            ) : (
              <ShieldCheck className="h-7 w-7 text-slate-300 dark:text-slate-600" />
            )}
          </div>
          <div>
            <h1 className="genesis-heading text-3xl font-bold text-[#0A0A0A] dark:text-[#F5F5F7]">
              Masuk ke Portal
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Pilih halaman yang sesuai dengan peran Anda.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {PORTAL_GROUPS.map((group) => (
            <section key={group.label}>
              <div className="mb-3 flex items-baseline gap-2">
                <h2 className="genesis-heading text-sm font-semibold text-[#0A0A0A] dark:text-[#F5F5F7]">{group.label}</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">{group.hint}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {group.portals.map((key) => {
                  const def = portals[key];
                  const Icon = def.icon;
                  const disabled = key === "siswa" && !studentLoginEnabled;
                  return (
                    <Link
                      key={key}
                      href={portalPath(key)}
                      className="group overflow-hidden rounded-2xl border border-[#E8E8EC] bg-[#FFFFFF] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.12)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-black/10 dark:border-white/10 dark:bg-[#19191C]"
                    >
                      <div className={`flex items-start gap-3 bg-gradient-to-br ${def.theme.panel} p-[18px] text-white`}>
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white/25 text-sm font-extrabold">
                          {def.title.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="genesis-heading text-[17.5px] font-extrabold leading-tight">{def.title}</span>
                            {disabled && (
                              <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold">
                                Lewat aplikasi mobile
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-[11.5px] text-white/80">{def.subtitle}</span>
                        </span>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 transition-transform group-hover:translate-x-1">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                      <div className="p-[18px]">
                        <p className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                          <Icon className="h-3.5 w-3.5" />
                          {def.audience}
                        </p>
                        <p className="mt-2.5 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">{def.tagline}</p>
                        <ul className="mt-3 space-y-1.5">
                          {def.features.map((feature) => (
                            <li key={feature} className={`flex items-center gap-2 text-xs ${def.theme.text}`}>
                              <Check className="h-3 w-3 shrink-0" strokeWidth={3} />
                              <span className="text-slate-600 dark:text-slate-300">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-9 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-600">
          <ShieldCheck className="h-3.5 w-3.5" />
          Akses terbatas untuk civitas SMK Hutama
        </p>
      </div>
    </div>
  );
}
