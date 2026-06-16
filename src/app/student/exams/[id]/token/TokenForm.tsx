"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, ShieldCheck, AlertCircle } from "lucide-react";
import { validateToken } from "../actions";

type Props = {
  examId: string;
  examTitle: string;
  subjectCode: string;
  startAt: Date;
  endAt: Date;
};

export function TokenForm({ examId, examTitle, subjectCode, startAt, endAt }: Props) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!token.trim()) { setError("Token wajib diisi"); return; }
    startTransition(async () => {
      const r = await validateToken(examId, token);
      if (r.error) setError(r.error);
      else router.push(`/student/exams/${examId}/confirm`);
    });
  }

  const fmt = (d: Date) => new Date(d).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="rounded-2xl border bg-white p-8 shadow-sm text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100">
        <KeyRound className="h-8 w-8 text-orange-600" />
      </div>
      <h1 className="font-heading text-xl font-bold text-gray-900">Masukkan Token Ujian</h1>
      <p className="mt-2 text-sm text-gray-500">Minta token kepada pengawas ujian</p>

      <div className="mt-2 rounded-lg bg-blue-50 border border-blue-100 p-3 text-left">
        <p className="text-xs font-semibold text-blue-800">{subjectCode} – {examTitle}</p>
        <p className="text-xs text-blue-600">{fmt(startAt)} – {fmt(endAt)}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="space-y-1.5 text-left">
          <Label htmlFor="token">Token Ujian</Label>
          <Input
            id="token" value={token}
            onChange={(e) => setToken(e.target.value.toUpperCase())}
            placeholder="cth: MTK-7842"
            className="h-12 text-center font-mono text-xl tracking-widest font-bold"
            maxLength={20}
            autoFocus
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        <Button type="submit" className="w-full h-12 bg-orange-500 hover:bg-orange-600 font-semibold" disabled={pending}>
          {pending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Memvalidasi...
            </span>
          ) : (
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Validasi & Lanjutkan</span>
          )}
        </Button>
      </form>

      <p className="mt-4 text-xs text-gray-400">Token salah atau kadaluarsa? Hubungi pengawas.</p>
    </div>
  );
}
