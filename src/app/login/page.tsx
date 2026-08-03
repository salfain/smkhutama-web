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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-5 py-12 dark:bg-slate-950">
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative w-full max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke beranda
        </Link>

        <div className="mb-9 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/api/school/logo" alt="Logo SMK Hutama" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
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
                <h2 className="font-heading text-sm font-bold text-slate-900 dark:text-white">{group.label}</h2>
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
                      className={`group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 ring-4 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 ${def.theme.card}`}
                    >
                      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white ${def.theme.icon}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className={`font-heading text-base font-bold ${def.theme.text}`}>{def.title}</span>
                          {disabled && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                              Lewat aplikasi mobile
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">{def.subtitle}</span>
                        <span className="mt-2 block text-xs text-slate-400 dark:text-slate-500">{def.audience}</span>
                      </span>
                      <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 dark:text-slate-600" />
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
