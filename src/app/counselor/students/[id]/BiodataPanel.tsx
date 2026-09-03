"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle2, HeartPulse, IdCard, Pencil, RotateCcw, User } from "lucide-react";
import { rejectStudentProfile, saveStudentProfile, verifyStudentProfile } from "../../bk-actions";

export type Biodata = {
  studentId: string;
  nis: string;
  nisn: string;
  birthPlace: string;
  birthDate: string;
  address: string;
  parentPhone: string;
  medicalHistory: string;
  photoUrl: string;
  status: "DRAFT" | "PENDING" | "VERIFIED" | "REJECTED";
  note: string;
  verifiedBy: string;
};

const statusStyle: Record<Biodata["status"], { label: string; cls: string }> = {
  DRAFT: { label: "Belum diisi siswa", cls: "bg-gray-100 text-gray-600" },
  PENDING: { label: "Menunggu verifikasi", cls: "bg-amber-100 text-amber-700" },
  VERIFIED: { label: "Terverifikasi", cls: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Dikembalikan", cls: "bg-red-100 text-red-700" },
};

export function BiodataPanel({ data }: { data: Biodata }) {
  const [mode, setMode] = useState<"view" | "edit" | "reject">("view");
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const badge = statusStyle[data.status];

  function run(action: (fd: FormData) => Promise<{ error?: string; success?: string }>, fd: FormData) {
    setMsg(null);
    startTransition(async () => {
      const res = await action(fd);
      if (res?.error) setMsg({ type: "error", text: res.error });
      else {
        setMsg({ type: "success", text: res?.success ?? "Tersimpan" });
        setMode("view");
      }
    });
  }

  function onFormSubmit(action: (fd: FormData) => Promise<{ error?: string; success?: string }>) {
    return (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      run(action, new FormData(e.currentTarget));
    };
  }

  return (
    <div className="min-w-0 rounded-2xl border bg-white p-4 shadow-sm sm:p-5 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 flex flex-wrap items-center gap-2 font-semibold text-gray-900 dark:text-white">
        <IdCard className="h-4 w-4 text-gray-400" /> Biodata Siswa
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${badge.cls}`}>{badge.label}</span>
        {mode === "view" && (
          <button
            type="button"
            onClick={() => setMode("edit")}
            className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:underline print:hidden"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}
      </h2>

      {mode === "view" ? (
        <>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border bg-gray-50 sm:h-28 sm:w-28">
              {data.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.photoUrl} alt="Foto siswa" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300"><User className="h-10 w-10" /></div>
              )}
            </div>
            <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
              <Row label="NISN" value={data.nisn} />
              <Row label="NIS" value={data.nis} />
              <Row label="Tempat, Tanggal Lahir" value={[data.birthPlace, formatDate(data.birthDate)].filter(Boolean).join(", ")} />
              <Row label="Nomor Orang Tua / Wali" value={data.parentPhone} />
              <div className="sm:col-span-2"><Row label="Alamat" value={data.address} /></div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/60 p-3 print:hidden dark:border-rose-900/40 dark:bg-rose-950/20">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
              <HeartPulse className="h-3.5 w-3.5" /> Riwayat Penyakit (rahasia)
            </p>
            <p className="mt-1 text-sm break-words whitespace-pre-line text-gray-800 dark:text-gray-200">{data.medicalHistory || "Tidak ada."}</p>
          </div>

          {data.status === "REJECTED" && data.note && (
            <p className="mt-3 text-xs text-red-600">Catatan perbaikan: {data.note}</p>
          )}
          {data.status === "VERIFIED" && data.verifiedBy && (
            <p className="mt-3 text-xs text-gray-400">Diverifikasi oleh {data.verifiedBy}.</p>
          )}

          {data.status === "PENDING" && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row print:hidden">
              <Button
                type="button"
                disabled={pending}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("studentId", data.studentId);
                  run(verifyStudentProfile, fd);
                }}
              >
                <CheckCircle2 className="h-4 w-4" /> Verifikasi
              </Button>
              <Button type="button" variant="outline" disabled={pending} onClick={() => setMode("reject")}>
                <RotateCcw className="h-4 w-4" /> Kembalikan ke Siswa
              </Button>
            </div>
          )}
        </>
      ) : mode === "reject" ? (
        <form onSubmit={onFormSubmit(rejectStudentProfile)} className="space-y-3 print:hidden">
          <input type="hidden" name="studentId" value={data.studentId} />
          <div>
            <Label htmlFor="note" className="mb-1 text-xs text-gray-500">Catatan perbaikan untuk siswa</Label>
            <Textarea id="note" name="note" required rows={3} placeholder="Contoh: alamat kurang lengkap, foto tidak jelas." />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>Kirim Catatan</Button>
            <Button type="button" variant="outline" onClick={() => setMode("view")}>Batal</Button>
          </div>
        </form>
      ) : (
        <form onSubmit={onFormSubmit(saveStudentProfile)} className="space-y-3 print:hidden">
          <input type="hidden" name="studentId" value={data.studentId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tempat Lahir" name="birthPlace" defaultValue={data.birthPlace} required />
            <Field label="Tanggal Lahir" name="birthDate" type="date" defaultValue={data.birthDate} required />
            <Field label="Nomor Orang Tua / Wali" name="parentPhone" type="tel" defaultValue={data.parentPhone} required />
            <div className="sm:col-span-2">
              <Label htmlFor="address" className="mb-1 text-xs text-gray-500">Alamat</Label>
              <Textarea id="address" name="address" defaultValue={data.address} required rows={3} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="medicalHistory" className="mb-1 text-xs text-gray-500">Riwayat Penyakit</Label>
              <Textarea id="medicalHistory" name="medicalHistory" defaultValue={data.medicalHistory} rows={3} />
            </div>
          </div>
          <p className="text-xs text-gray-400">Menyimpan dari sini otomatis menandai biodata sebagai terverifikasi.</p>
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>{pending ? "Menyimpan..." : "Simpan"}</Button>
            <Button type="button" variant="outline" onClick={() => setMode("view")}>Batal</Button>
          </div>
        </form>
      )}

      {msg && (
        <p className={`mt-3 rounded-lg px-3 py-2 text-sm print:hidden ${msg.type === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium break-words text-gray-900 dark:text-white">{value || "-"}</p>
    </div>
  );
}

function Field({ label, name, defaultValue, required, ...rest }: {
  label: string; name: string; defaultValue: string; required?: boolean;
} & React.ComponentProps<typeof Input>) {
  return (
    <div>
      <Label htmlFor={name} className="mb-1 text-xs text-gray-500">{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} required={required} {...rest} />
    </div>
  );
}
