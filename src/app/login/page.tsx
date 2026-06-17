"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn, ArrowLeft, GraduationCap, HeartHandshake } from "lucide-react";
import { loginAction } from "./actions";
import { FullScreenLoader } from "@/components/FullScreenLoader";

type Role = "ADMIN" | "TEACHER" | "STUDENT" | "COUNSELOR";
type System = "CBT" | "SIBIKONS";

const roleConfig: Record<Role, { label: string; bg: string; placeholder: string }> = {
  ADMIN:   { label: "Admin",  bg: "bg-blue-600 hover:bg-blue-700",       placeholder: "admin" },
  TEACHER: { label: "Guru",   bg: "bg-emerald-600 hover:bg-emerald-700", placeholder: "sari.dewi" },
  STUDENT: { label: "Siswa",  bg: "bg-blue-500 hover:bg-blue-600",   placeholder: "2324001 / NIS / Username" },
  COUNSELOR: { label: "Guru BK", bg: "bg-purple-600 hover:bg-purple-700", placeholder: "bk.hutama" },
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

  const sys = systemConfig[system];
  const cfg = roleConfig[role];

  function selectSystem(s: System) {
    setSystem(s);
    setRole(systemConfig[s].roles[0]);
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const r = await loginAction(username.trim(), password, role);
      if ("error" in r) setError(r.error);
      else {
        // Siswa yang masuk lewat SIBIKONS diarahkan ke portal BK siswa
        const dest = system === "SIBIKONS" && role === "STUDENT" ? "/student/bk" : r.redirectTo;
        setRedirecting(true);
        window.location.href = dest;
      }
    });
  }

  const leftPanelBg = system === "CBT"
    ? "from-blue-700 to-indigo-700"
    : "from-purple-700 to-fuchsia-700";

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />Kembali ke beranda
          </Link>

          {/* System selector */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            {(Object.entries(systemConfig) as [System, typeof sys][]).map(([key, val]) => {
              const Icon = val.icon;
              const selected = system === key;
              const selBlue = key === "CBT";
              return (
                <button key={key} type="button" onClick={() => selectSystem(key)}
                  className={`flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all ${
                    selected
                      ? selBlue
                        ? "border-blue-600 bg-blue-50 shadow-sm"
                        : "border-purple-600 bg-purple-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    selected ? (selBlue ? "bg-blue-600" : "bg-purple-600") : "bg-gray-100"
                  }`}>
                    <Icon className={`h-5 w-5 ${selected ? "text-white" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${selected ? (selBlue ? "text-blue-700" : "text-purple-700") : "text-gray-700"}`}>
                      {key === "CBT" ? "CBT" : "SIBIKONS"}
                    </p>
                    <p className="text-[11px] leading-tight text-gray-500">
                      {key === "CBT" ? "Ujian Online" : "Bimbingan Konseling"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <div className="mb-6">
              <h1 className="font-heading text-2xl font-bold text-gray-900">{sys.title}</h1>
              <p className="mt-1 text-sm text-gray-500">{sys.subtitle}</p>
            </div>

            {/* Role tabs — hanya tampil bila lebih dari 1 role */}
            {sys.roles.length > 1 && (
              <div className={`mb-6 grid gap-2 rounded-xl bg-gray-100 p-1 ${sys.roles.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {sys.roles.map((key) => (
                  <button key={key} type="button"
                    onClick={() => { setRole(key); setError(""); }}
                    className={`rounded-lg py-2 text-sm font-medium transition-all ${
                      role === key ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                    }`}>
                    {roleConfig[key].label}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">{role === "STUDENT" ? "NIS / NISN / Username" : "Username"}</Label>
                <Input id="username" type="text" placeholder={cfg.placeholder} value={username} onChange={(e) => setUsername(e.target.value)} className="h-11" autoComplete="username" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pr-10" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</p>}
              <Button type="submit" className={`w-full h-11 ${cfg.bg} font-semibold`} disabled={pending}>
                {pending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Memproses...
                  </span>
                ) : (
                  <span className="flex items-center gap-2"><LogIn className="h-4 w-4" />Masuk sebagai {cfg.label}</span>
                )}
              </Button>
            </form>

            <div className="mt-5 rounded-lg bg-gray-50 border border-dashed border-gray-200 p-3 text-xs text-gray-500">
              <p className="font-semibold mb-1 text-gray-600">Akun default:</p>
              {system === "CBT" ? (
                <>
                  <p>Admin: <span className="font-mono">admin</span> / <span className="font-mono">admin123</span></p>
                  <p>Guru: <span className="font-mono">sari.dewi</span> / <span className="font-mono">guru123</span></p>
                  <p>Siswa: <span className="font-mono">2324001</span> / <span className="font-mono">siswa123</span></p>
                </>
              ) : (
                <>
                  <p>Guru BK: <span className="font-mono">bk.hutama</span> / <span className="font-mono">bk123</span></p>
                  <p>Siswa: <span className="font-mono">2324001</span> / <span className="font-mono">siswa123</span></p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
