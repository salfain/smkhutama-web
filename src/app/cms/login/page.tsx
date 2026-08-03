"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LayoutTemplate } from "lucide-react";
import { cmsLogin } from "../actions";
import { FullScreenLoader } from "@/components/FullScreenLoader";

export default function CmsLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const r = await cmsLogin(username.trim(), password);
      if ("error" in r && r.error) setError(r.error);
      else { setRedirecting(true); window.location.href = "/cms/dashboard"; }
    });
  }

  return (
    <div className="genesis-app flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4 dark:bg-[#111113]">
      {redirecting && <FullScreenLoader message="Mengarahkan ke dashboard..." />}
      <div className="w-full max-w-sm rounded-xl border border-[#E8E8EC] bg-[#FFFFFF] p-8 dark:border-white/10 dark:bg-[#19191C]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-[#F5F5F7] dark:bg-white/5">
            <LayoutTemplate className="h-7 w-7 text-[#6B6B6B] dark:text-[#A7A7AE]" />
          </div>
          <h1 className="font-heading text-xl font-bold text-slate-900">CMS Landing Page</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola konten beranda & PPDB</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="u">Username</Label>
            <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="cms" className="bg-white" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p">Password</Label>
            <div className="relative">
              <Input id="p" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-white pr-10" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {error && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</p>}
          <Button type="submit" className="h-11 w-full rounded-md bg-brand font-semibold text-white hover:bg-brand-strong hover:shadow-[0_4px_12px_rgba(99,102,241,0.35)]" disabled={pending}>
            {pending ? "Memproses..." : "Masuk CMS"}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">Akun default: <span className="font-mono">cms / cms123</span></p>
      </div>
    </div>
  );
}
