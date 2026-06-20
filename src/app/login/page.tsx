"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn, ArrowLeft, GraduationCap, HeartHandshake, ClipboardList } from "lucide-react";
import { loginAction } from "./actions";
import { FullScreenLoader } from "@/components/FullScreenLoader";

type Role = "ADMIN" | "TEACHER" | "STUDENT" | "COUNSELOR" | "PIKET";
type System = "CBT" | "SIBIKONS" | "PIKET";

const roleConfig: Record<Role, { label: string; bg: string; placeholder: string }> = {
  ADMIN:   { label: "Admin",      bg: "bg-blue-600 hover:bg-blue-700",       placeholder: "admin" },
  TEACHER: { label: "Guru",       bg: "bg-emerald-600 hover:bg-emerald-700", placeholder: "sari.dewi" },
  STUDENT: { label: "Siswa",      bg: "bg-blue-500 hover:bg-blue-600",       placeholder: "2324001 / NIS / Username" },
  COUNSELOR: { label: "Guru BK",  bg: "bg-purple-600 hover:bg-purple-700",   placeholder: "bk.hutama" },
  PIKET:   { label: "Guru Piket", bg: "bg-amber-500 hover:bg-amber-600",     placeholder: "piket.hutama" },
};

const systemConfig: Record<System, {
  title: string; subtitle: string; roles: Role[]; accent: string; icon: typeof GraduationCap;
  tagline: string; features: string[];
}> = {
  CBT: {
    title: "CBT — Ujian Online",
    subtitle: "Untuk Admin, Guru, dan Siswa",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
    accent: "blue",
    icon: GraduationCap,
    tagline: "Sistem ujian digital berbasis web yang modern, aman, dan responsif untuk seluruh civitas SMK HUTAMA.",
    features: ["Ujian bergaya TKA/CBT", "Token ujian aman", "Autosave jawaban", "Laporan & analisis otomatis"],
  },
  SIBIKONS: {
    title: "SIBIKONS — Bimbingan Konseling",
    subtitle: "Untuk Guru BK dan Siswa",
    roles: ["COUNSELOR", "STUDENT"],
    accent: "purple",
    icon: HeartHandshake,
    tagline: "Sistem informasi bimbingan konseling untuk mengelola sesi konseling, poin pelanggaran, dan prestasi siswa.",
    features: ["Catatan sesi konseling", "Poin pelanggaran siswa", "Pencatatan prestasi", "Ajukan konseling (siswa)"],
  },
  PIKET: {
    title: "Guru Piket",
    subtitle: "Untuk guru yang sedang terjadwal piket",
    roles: ["TEACHER"],
    accent: "amber",
    icon: ClipboardList,
    tagline: "Sistem pencatatan ketertiban harian: kehadiran guru, keterlambatan siswa, dan izin keluar/masuk.",
    features: ["Catat keterlambatan siswa", "Pantau izin keluar/masuk", "Rekap kehadiran guru", "Dashboard harian"],
  },
};

export default function LoginPage() {
  const [system, setSystem] = useState<System>("CBT");
  const [role, setRole] = useState<Role>("STUDENT");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const [pending, startTransition] = useTransition();

  // Update title tab browser secara dinamis
  useEffect(() => {
    const systemNames: Record<System, string> = {
      CBT: "Login CBT",
      SIBIKONS: "Login SIBIKONS",
      PIKET: "Login Piket",
    };
    document.title = `${systemNames[system]} | SMK Hutama`;
  }, [system]);

  const sys = systemConfig[system];
  const cfg = roleConfig[role];
  const loginLabel = system === "PIKET" && role === "TEACHER" ? "Guru Piket" : cfg.label;
  const loginButtonBg = system === "PIKET" ? "bg-amber-500 hover:bg-amber-600" : cfg.bg;

  function selectSystem(s: System) {
    setSystem(s);
    setRole(systemConfig[s].roles[0]);
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const r = await loginAction(username.trim(), password, role, system);
      if ("error" in r) setError(r.error);
      else {
        // Simpan system aktif untuk student di cookie agar bisa dibaca di server & client
        if (role === "STUDENT") {
          document.cookie = `student-system=${system}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        } else {
          document.cookie = "student-system=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }

        // Siswa yang masuk lewat SIBIKONS diarahkan ke portal BK siswa
        const dest = system === "SIBIKONS" && role === "STUDENT" ? "/student/bk" : r.redirectTo;
        setRedirecting(true);
        window.location.href = dest;
      }
    });
  }

  const leftPanelBg = system === "CBT"
    ? "from-blue-700 to-indigo-700"
    : system === "SIBIKONS"
    ? "from-purple-700 to-fuchsia-700"
    : "from-amber-500 to-orange-500";

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {redirecting && <FullScreenLoader message="Mengarahkan ke dashboard..." accent={system === "SIBIKONS" ? "purple" : "blue"} />}
      {/* Left panel */}
      <div className={`hidden flex-1 flex-col items-center justify-center bg-gradient-to-br ${leftPanelBg} p-12 text-white lg:flex transition-colors duration-500`}>
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/api/school/logo" alt="Logo" className="h-20 w-20 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <h2 className="font-heading text-3xl font-bold text-center">{sys.title}</h2>
        <p className="mt-3 max-w-xs text-center text-white/80 text-sm leading-relaxed">{sys.tagline}</p>
        <div className="mt-10 w-full max-w-xs space-y-3">
          {sys.features.map((t) => (
            <div key={t} className="flex items-center gap-3 text-sm text-white/90">
              <div className="h-1.5 w-1.5 rounded-full bg-white/60" />{t}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <ArrowLeft className="h-4 w-4" />Kembali ke beranda
          </Link>

          {/* System selector */}
          <div className="mb-5 grid grid-cols-3 gap-3">
            {(Object.entries(systemConfig) as [System, typeof sys][]).map(([key, val]) => {
              const Icon = val.icon;
              const selected = system === key;
              const accentClass =
                key === "CBT" ? "border-blue-600 bg-blue-50/70 shadow-sm dark:border-blue-500 dark:bg-blue-950/30"
                : key === "SIBIKONS" ? "border-purple-600 bg-purple-50/70 shadow-sm dark:border-purple-500 dark:bg-purple-950/30"
                : "border-amber-500 bg-amber-50/70 shadow-sm dark:border-amber-500 dark:bg-amber-950/30";
              const iconClass =
                key === "CBT" ? "bg-blue-600"
                : key === "SIBIKONS" ? "bg-purple-600"
                : "bg-amber-500";
              const textClass =
                key === "CBT" ? "text-blue-700 dark:text-blue-400"
                : key === "SIBIKONS" ? "text-purple-700 dark:text-purple-400"
                : "text-amber-700 dark:text-amber-400";
              return (
                <button key={key} type="button" onClick={() => selectSystem(key)}
                  className={`flex flex-col items-start gap-2 rounded-2xl border-2 p-3 text-left transition-all ${
                    selected ? accentClass : "border-slate-200 bg-white hover:border-gray-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                  }`}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                    selected ? iconClass : "bg-gray-100 dark:bg-slate-800"
                  }`}>
                    <Icon className={`h-4 w-4 ${selected ? "text-white" : "text-gray-400 dark:text-gray-500"}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${selected ? textClass : "text-gray-700 dark:text-gray-300"}`}>
                      {key}
                    </p>
                    <p className="text-[10px] leading-tight text-gray-500 dark:text-gray-400">
                      {key === "CBT" ? "Ujian Online" : key === "SIBIKONS" ? "Bimbingan Konseling" : "Piket Harian"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6">
              <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">{sys.title}</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{sys.subtitle}</p>
            </div>

            {/* Role tabs — hanya tampil bila lebih dari 1 role */}
            {sys.roles.length > 1 && (
              <div className={`mb-6 grid gap-2 rounded-xl bg-gray-100 p-1 dark:bg-slate-950 ${sys.roles.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {sys.roles.map((key) => (
                  <button key={key} type="button"
                    onClick={() => { setRole(key); setError(""); }}
                    className={`rounded-lg py-2 text-sm font-medium transition-all ${
                      role === key ? "bg-white shadow-sm text-slate-900 dark:bg-slate-800 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}>
                    {roleConfig[key].label}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-slate-900 dark:text-slate-300">{role === "STUDENT" ? "NIS / NISN / Username" : "Username"}</Label>
                <Input id="username" type="text" placeholder={cfg.placeholder} value={username} onChange={(e) => setUsername(e.target.value)} className="h-11 bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white" autoComplete="username" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-900 dark:text-slate-300">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pr-10 bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">{error}</p>}
              <Button type="submit" className={`w-full h-11 ${loginButtonBg} font-semibold`} disabled={pending}>
                {pending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Memproses...
                  </span>
                ) : (
                  <span className="flex items-center gap-2"><LogIn className="h-4 w-4" />Masuk sebagai {loginLabel}</span>
                )}
              </Button>
            </form>

            <div className="mt-5 rounded-lg bg-gray-50 border border-dashed border-gray-200 p-3 text-xs text-slate-500 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400">
              <p className="font-semibold mb-1 text-slate-600 dark:text-slate-400">Akun default:</p>
              {system === "CBT" ? (
                <>
                  <p>Admin: <span className="font-mono text-slate-900 dark:text-white">admin</span> / <span className="font-mono text-slate-900 dark:text-white">admin123</span></p>
                  <p>Guru: <span className="font-mono text-slate-900 dark:text-white">sari.dewi</span> / <span className="font-mono text-slate-900 dark:text-white">guru123</span></p>
                  <p>Siswa: <span className="font-mono text-slate-900 dark:text-white">2324001</span> / <span className="font-mono text-slate-900 dark:text-white">siswa123</span></p>
                </>
              ) : system === "SIBIKONS" ? (
                <>
                  <p>Guru BK: <span className="font-mono text-slate-900 dark:text-white">bk.hutama</span> / <span className="font-mono text-slate-900 dark:text-white">bk123</span></p>
                  <p>Siswa: <span className="font-mono text-slate-900 dark:text-white">2324001</span> / <span className="font-mono text-slate-900 dark:text-white">siswa123</span></p>
                </>
              ) : (
                <>
                  <p>Gunakan akun guru yang dijadwalkan piket oleh admin.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
