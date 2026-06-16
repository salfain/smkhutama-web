"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn, ArrowLeft, ShieldCheck } from "lucide-react";
import { loginAction } from "./actions";

type Role = "ADMIN" | "TEACHER" | "STUDENT" | "COUNSELOR";

const roleConfig: Record<Role, { label: string; bg: string; placeholder: string }> = {
  ADMIN:   { label: "Admin",  bg: "bg-blue-600 hover:bg-blue-700",       placeholder: "admin" },
  TEACHER: { label: "Guru",   bg: "bg-emerald-600 hover:bg-emerald-700", placeholder: "sari.dewi" },
  STUDENT: { label: "Siswa",  bg: "bg-orange-500 hover:bg-orange-600",   placeholder: "2324001 / NIS / Username" },
  COUNSELOR: { label: "Guru BK", bg: "bg-purple-600 hover:bg-purple-700", placeholder: "bk.hutama" },
};

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("STUDENT");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const cfg = roleConfig[role];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const r = await loginAction(username.trim(), password, role);
      if ("error" in r) setError(r.error);
      else window.location.href = r.redirectTo;
    });
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Left panel */}
      <div className="hidden flex-1 flex-col items-center justify-center bg-gradient-to-br from-blue-700 to-indigo-700 p-12 text-white lg:flex">
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/api/school/logo" alt="Logo" className="h-20 w-20 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <h2 className="font-heading text-3xl font-bold text-center">CBT SMK HUTAMA</h2>
        <p className="mt-3 max-w-xs text-center text-blue-200 text-sm leading-relaxed">
          Sistem ujian digital berbasis web yang modern, aman, dan responsif untuk seluruh civitas SMK HUTAMA.
        </p>
        <div className="mt-10 w-full max-w-xs space-y-3">
          {["Ujian bergaya TKA/CBT", "Token ujian aman", "Autosave jawaban", "Laporan & analisis otomatis"].map((t) => (
            <div key={t} className="flex items-center gap-3 text-sm text-blue-100">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-300" />{t}
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

          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <div className="mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 mb-4 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/api/school/logo" alt="Logo SMK HUTAMA" className="h-12 w-12 object-contain" onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = 'none';
                  el.parentElement!.innerHTML = '<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg></div>';
                }} />
              </div>
              <h1 className="font-heading text-2xl font-bold text-gray-900">Masuk ke Sistem</h1>
              <p className="mt-1 text-sm text-gray-500">Pilih role dan masukkan akun Anda</p>
            </div>

            <div className="mb-6 grid grid-cols-4 gap-2 rounded-xl bg-gray-100 p-1">
              {(Object.entries(roleConfig) as [Role, typeof cfg][]).map(([key, val]) => (
                <button key={key} type="button"
                  onClick={() => { setRole(key); setError(""); }}
                  className={`rounded-lg py-2 text-xs font-medium transition-all ${
                    role === key ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}>
                  {val.label}
                </button>
              ))}
            </div>

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
              <p>Admin: <span className="font-mono">admin</span> / <span className="font-mono">admin123</span></p>
              <p>Guru: <span className="font-mono">sari.dewi</span> / <span className="font-mono">guru123</span></p>
              <p>Siswa: <span className="font-mono">2324001</span> / <span className="font-mono">siswa123</span></p>
              <p className="mt-1 text-gray-400 italic">Jalankan <code>npm run db:seed</code> untuk membuat akun.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
