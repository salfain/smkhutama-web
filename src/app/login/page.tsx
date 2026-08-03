import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
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
 * server — sekaligus bisa membaca saklar login siswa tanpa perlu efek klien.
 */
export default async function LoginChooserPage() {
  const studentLoginEnabled = await getStudentWebLoginEnabled().catch(() => true);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-5 py-12 dark:bg-[#111113]">
      <div className="w-full max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke beranda
        </Link>

        <div className="mb-9 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-[#E8E8EC] bg-[#FFFFFF] dark:border-white/10 dark:bg-[#19191C]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/api/school/logo" alt="Logo SMK Hutama" className="h-10 w-10 object-contain" />
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

              <div className="space-y-3">
                {group.portals.map((key) => {
                  const def = portals[key];
                  const Icon = def.icon;
                  const disabled = key === "siswa" && !studentLoginEnabled;
                  return (
                    <Link
                      key={key}
                      href={portalPath(key)}
                      className="group flex items-center gap-4 rounded-xl border border-[#E8E8EC] bg-[#FFFFFF] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/15 dark:border-white/10 dark:bg-[#19191C] dark:hover:border-brand"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#F5F5F7] text-[#6B6B6B] transition-colors group-hover:bg-brand-soft group-hover:text-brand-text dark:bg-white/5 dark:text-[#A7A7AE] dark:group-hover:bg-brand/10 dark:group-hover:text-brand-text">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="genesis-heading text-base font-semibold text-[#0A0A0A] group-hover:text-brand-text dark:text-[#F5F5F7] dark:group-hover:text-brand-text">{def.title}</span>
                          {disabled && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                              Lewat aplikasi mobile
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">{def.subtitle}</span>
                        <span className="mt-2 block text-xs text-slate-400 dark:text-slate-500">{def.audience}</span>
                      </span>
                      <ArrowRight className="h-5 w-5 shrink-0 text-[#9C9C9C] transition-all group-hover:translate-x-1 group-hover:text-brand-text" />
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
