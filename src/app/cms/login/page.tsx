"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LayoutTemplate } from "lucide-react";
import { cmsLogin } from "../actions";

export default function CmsLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const r = await cmsLogin(username.trim(), password);
      if ("error" in r && r.error) setError(r.error);
      else router.push("/cms/dashboard");
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center mesh-bg px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-float-slow absolute -left-16 top-10 h-64 w-64 rounded-full bg-blue-400/30 blur-3xl" />
        <div className="animate-float-slower absolute right-0 bottom-10 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
      </div>
      <div className="relative w-full max-w-sm rounded-3xl glass-light p-8 shadow-2xl animate-scale-in">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
            <LayoutTemplate className="h-7 w-7 text-white" />
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
          <Button type="submit" className="w-full rounded-full bg-blue-600 hover:bg-blue-700" disabled={pending}>
            {pending ? "Memproses..." : "Masuk CMS"}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">Akun default: <span className="font-mono">cms / cms123</span></p>
      </div>
    </div>
  );
}
