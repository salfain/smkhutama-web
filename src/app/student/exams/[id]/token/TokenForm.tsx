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

  function tapDigit(char: string) {
    setToken((t) => (t.length < 20 ? t + char : t));
  }
  function tapBackspace() {
    setToken((t) => t.slice(0, -1));
  }
  function tapClear() {
    setToken("");
  }

  const keypadKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"];

  return (
    <div className="rounded-2xl border bg-white p-8 shadow-sm text-center">
      <div className="mx-auto mb-4 flex h-[68px] w-[68px] items-center justify-center rounded-[20px] bg-brand-soft">
        <KeyRound className="h-8 w-8 text-brand-text" />
      </div>
      <h1 className="font-heading text-xl font-bold text-gray-900">Masukkan Token Ujian</h1>
      <p className="mt-2 text-sm text-gray-500">Minta token kepada pengawas ujian</p>

      <div className="mt-2 rounded-lg bg-brand-soft border border-brand-soft p-3 text-left">
        <p className="text-xs font-semibold text-brand-text">{subjectCode} – {examTitle}</p>
        <p className="text-xs text-brand-text">{fmt(startAt)} – {fmt(endAt)}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="space-y-1.5 text-left">
          <Label htmlFor="token">Token Ujian</Label>
          <Input
            id="token" value={token}
            onChange={(e) => setToken(e.target.value.toUpperCase())}
            placeholder="cth: MTK-7842"
            className={`h-[60px] rounded-2xl text-center font-mono text-[26px] font-bold tracking-[0.18em] ${error ? "border-red-300" : ""}`}
            maxLength={20}
            autoFocus
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        {/* Keypad angka on-screen — pelengkap keyboard fisik, memudahkan input di layar sentuh (PWA). */}
        <div className="grid grid-cols-3 gap-2">
          {keypadKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => (key === "C" ? tapClear() : key === "⌫" ? tapBackspace() : tapDigit(key))}
              className={`rounded-[14px] py-[15px] text-base font-bold transition-colors ${
                key === "C" || key === "⌫"
                  ? "bg-[#E2E8F0] text-gray-600 hover:bg-[#CBD5E1]"
                  : "bg-white text-gray-800 border border-[#E2E8F0] hover:bg-brand-soft"
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        <Button type="submit" className="w-full h-12 bg-brand hover:bg-brand-strong font-semibold" disabled={pending}>
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
