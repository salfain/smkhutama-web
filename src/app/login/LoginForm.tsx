"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  LogIn,
  ArrowLeft,
  User,
  Lock,
  Check,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { getStudentWebLoginEnabled, loginAction } from "./actions";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { portals, type Portal } from "./portals";

/**
 * Formulir satu portal login.
 *
 * Portalnya ditentukan oleh route (`/login/siswa`, `/login/guru`, …), bukan oleh
 * pilihan di dalam halaman — jadi tautan ke pintu tertentu bisa dibagikan
 * langsung ke kelompok yang dituju. Peran tidak pernah ditanyakan: server
 * membacanya dari akun, lalu menolak bila akun itu tidak berhak lewat sini.
 */
export function LoginForm({ portal }: { portal: Portal }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const [allowStudentWebLogin, setAllowStudentWebLogin] = useState(true);
  const [pending, startTransition] = useTransition();

  const def = portals[portal];
  const theme = def.theme;
  const Icon = def.icon;

  // Saklar login siswa hanya relevan di pintu yang memang melayani siswa.
  const studentDoor = def.roles.includes("STUDENT");

  useEffect(() => {
    if (!studentDoor) return;
    let active = true;
    getStudentWebLoginEnabled()
      .then((enabled) => {
        if (!active) return;
        setAllowStudentWebLogin(enabled);
      })
      .catch(() => {
        if (active) setAllowStudentWebLogin(false);
      });
    return () => { active = false; };
  }, [studentDoor]);

  const studentLoginOff = studentDoor && !allowStudentWebLogin;
  const identityLabel = def.identity === "NIS" ? "NIS / NISN / Username" : "Username";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const r = await loginAction(username.trim(), password, portal);
      if ("error" in r) setError(r.error);
      else {
        // Simpan system aktif untuk student di cookie agar bisa dibaca di server & client
        if (r.role === "STUDENT") {
          document.cookie = `student-system=${def.system}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        } else {
          document.cookie = "student-system=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }

        // Siswa yang masuk lewat SIBIKONS diarahkan ke portal BK siswa
        const dest = def.system === "SIBIKONS" && r.role === "STUDENT" ? "/student/bk" : r.redirectTo;
        setRedirecting(true);
        window.location.href = dest;
      }
    });
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 lg:grid lg:grid-cols-[1.1fr_1fr]">
      {redirecting && <FullScreenLoader message="Mengarahkan ke dashboard..." accent={def.system === "SIBIKONS" ? "purple" : "blue"} />}

      {/* ── Panel kiri: identitas portal ── */}
      <aside className={`relative hidden overflow-hidden bg-gradient-to-br p-12 text-white lg:flex lg:flex-col lg:justify-between ${theme.panel}`}>
        {/* Ornamen: kisi halus + dua bola cahaya */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, #000 40%, transparent 100%)",
          }}
        />
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-black/15 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/api/school/logo"
              alt="Logo SMK Hutama"
              className="h-9 w-9 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div className="leading-tight">
            <p className="font-heading text-base font-bold">SMK HUTAMA</p>
            <p className="text-xs text-white/70">Portal Sistem Sekolah</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/20 backdrop-blur-sm">
            <Icon className="h-3.5 w-3.5" />
            {def.audience}
          </span>
          <h2 className="font-heading mt-5 text-4xl leading-tight font-bold tracking-tight">{def.title}</h2>
          <p className="mt-4 text-sm leading-relaxed text-white/75">{def.tagline}</p>

          <ul className="mt-9 space-y-3.5">
            {def.features.map((t) => (
              <li key={t} className="flex items-center gap-3 text-sm text-white/90">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/25">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-xs text-white/60">
          <ShieldCheck className="h-3.5 w-3.5" />
          Akses terbatas untuk civitas SMK Hutama
        </p>
      </aside>

      {/* ── Panel kanan: formulir ── */}
      <main className="relative flex items-center justify-center px-5 py-10 sm:px-8">
        <div aria-hidden className={`pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full blur-3xl ${theme.glow} opacity-40 lg:hidden`} />

        <div className="relative w-full max-w-md">
          <Link
            href="/login"
            className="mb-7 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Pilih halaman login lain
          </Link>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
            <div className={`h-1.5 bg-gradient-to-r ${theme.bar}`} />

            <div className="p-7 sm:p-8">
              <div className="mb-6 flex items-start gap-3.5">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white ${theme.icon}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {def.title}
                  </h1>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{def.subtitle}</p>
                </div>
              </div>

              {studentLoginOff && (
                <p className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Login siswa melalui website sedang dinonaktifkan. Silakan gunakan aplikasi mobile.</span>
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-slate-700 dark:text-slate-300">
                    {identityLabel}
                  </Label>
                  <div className={`flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50/70 pl-3.5 ring-4 ring-transparent transition-all dark:border-slate-700 dark:bg-slate-950/50 ${theme.field}`}>
                    <User className="h-4 w-4 shrink-0 text-slate-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder={def.placeholder}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-12 border-0 bg-transparent px-3 text-sm shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent dark:text-white"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">Password</Label>
                  <div className={`flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50/70 pl-3.5 pr-1.5 ring-4 ring-transparent transition-all dark:border-slate-700 dark:bg-slate-950/50 ${theme.field}`}>
                    <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 border-0 bg-transparent px-3 text-sm shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent dark:text-white"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </p>
                )}

                <Button
                  type="submit"
                  className={`h-12 w-full rounded-xl text-[15px] font-semibold text-white shadow-lg shadow-slate-900/10 transition-all hover:shadow-xl active:scale-[0.99] ${theme.button}`}
                  disabled={pending}
                >
                  {pending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Memproses...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      {def.button}
                    </span>
                  )}
                </Button>
              </form>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/80 px-7 py-4 text-xs leading-relaxed text-slate-500 sm:px-8 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
              <p>
                <span className="font-semibold text-slate-600 dark:text-slate-300">Butuh bantuan?</span>{" "}
                Jika ada kendala login atau lupa password, silakan hubungi admin sekolah.
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-600">
            © {new Date().getFullYear()} SMK Hutama · Semua hak dilindungi
          </p>
        </div>
      </main>
    </div>
  );
}
