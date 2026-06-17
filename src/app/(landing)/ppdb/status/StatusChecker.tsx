"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle2, Clock, XCircle, ShieldCheck } from "lucide-react";
import { checkRegistrationStatus } from "../actions";

type Result = {
  registNumber: string; fullName: string; selectedMajor: string;
  status: "PENDING" | "VERIFIED" | "ACCEPTED" | "REJECTED"; notes: string; createdAt: string | Date;
};

const statusMeta: Record<string, { label: string; cls: string; icon: typeof Clock; desc: string }> = {
  PENDING: { label: "Menunggu Verifikasi", cls: "bg-gray-100 text-gray-700", icon: Clock, desc: "Pendaftaran Anda sedang menunggu verifikasi panitia." },
  VERIFIED: { label: "Terverifikasi", cls: "bg-blue-100 text-blue-700", icon: ShieldCheck, desc: "Berkas Anda telah diverifikasi dan sedang dalam proses seleksi." },
  ACCEPTED: { label: "Diterima", cls: "bg-green-100 text-green-700", icon: CheckCircle2, desc: "Selamat! Anda dinyatakan DITERIMA. Silakan lakukan daftar ulang." },
  REJECTED: { label: "Belum Diterima", cls: "bg-red-100 text-red-700", icon: XCircle, desc: "Mohon maaf, Anda belum diterima pada periode ini." },
};

export function StatusChecker() {
  const [num, setNum] = useState("");
  const [err, setErr] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setResult(null);
    startTransition(async () => {
      const r = await checkRegistrationStatus(num);
      if ("error" in r && r.error) setErr(r.error);
      else if ("data" in r) setResult(r.data as Result);
    });
  }

  return (
    <div>
      <form onSubmit={submit} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nomor Pendaftaran</label>
        <div className="mt-2 flex gap-2">
          <Input value={num} onChange={(e) => setNum(e.target.value)} placeholder="PPDB-2026-12345" className="h-11" />
          <Button type="submit" className="h-11 gap-1.5 bg-amber-400 px-5 font-semibold text-slate-900 hover:bg-amber-300" disabled={pending}>
            <Search className="h-4 w-4" />{pending ? "..." : "Cek"}
          </Button>
        </div>
        {err && <p className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{err}</p>}
      </form>

      {result && (
        <div className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm animate-scale-in">
          {(() => {
            const meta = statusMeta[result.status];
            const Icon = meta.icon;
            return (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">{result.registNumber}</p>
                    <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">{result.fullName}</p>
                    <p className="text-xs text-slate-500">Pilihan: {result.selectedMajor}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.cls}`}>
                    <Icon className="h-3.5 w-3.5" />{meta.label}
                  </span>
                </div>
                <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 p-4 text-sm text-slate-600 dark:text-slate-300">
                  {meta.desc}
                  {result.notes && <p className="mt-2 text-xs text-slate-500">Catatan panitia: {result.notes}</p>}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
