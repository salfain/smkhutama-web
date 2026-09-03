"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Clock, Lock, Upload, User } from "lucide-react";
import { saveMyProfile } from "./actions";

export type MyProfile = {
  name: string;
  nis: string;
  nisn: string;
  className: string;
  major: string;
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

const statusStyle: Record<MyProfile["status"], { label: string; cls: string; icon: typeof Clock }> = {
  DRAFT: { label: "Belum dikirim", cls: "bg-gray-100 text-gray-600", icon: AlertCircle },
  PENDING: { label: "Menunggu verifikasi BK", cls: "bg-amber-100 text-amber-700", icon: Clock },
  VERIFIED: { label: "Terverifikasi", cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  REJECTED: { label: "Perlu diperbaiki", cls: "bg-red-100 text-red-700", icon: AlertCircle },
};

export function ProfileForm({ profile }: { profile: MyProfile }) {
  const locked = profile.status === "VERIFIED";
  const [preview, setPreview] = useState(profile.photoUrl);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const badge = statusStyle[profile.status];
  const StatusIcon = badge.icon;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg(null);
    startTransition(async () => {
      const res = await saveMyProfile(fd);
      if (res?.error) setMsg({ type: "error", text: res.error });
      else if (res?.success) setMsg({ type: "success", text: res.success });
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${badge.cls}`}>
        <StatusIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold">{badge.label}</p>
          {profile.status === "VERIFIED" && (
            <p className="text-xs opacity-80">
              Diverifikasi{profile.verifiedBy && ` oleh ${profile.verifiedBy}`}. Hubungi guru BK bila ada data yang perlu diubah.
            </p>
          )}
          {profile.status === "REJECTED" && profile.note && (
            <p className="text-xs opacity-80">Catatan BK: {profile.note}</p>
          )}
        </div>
      </div>

      {/* Identitas resmi - dikelola admin, siswa hanya membaca. */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <Lock className="h-4 w-4 text-gray-400" /> Identitas Resmi
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ReadOnly label="Nama Lengkap" value={profile.name} />
          <ReadOnly label="Kelas / Jurusan" value={`${profile.className} · ${profile.major}`} />
          <ReadOnly label="NISN" value={profile.nisn || "-"} />
          <ReadOnly label="NIS" value={profile.nis || "-"} />
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Data ini mengikuti Dapodik. Bila keliru, laporkan ke guru BK atau admin.
        </p>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <User className="h-4 w-4 text-gray-400" /> Data Pribadi
        </h2>

        <div className="mb-4 flex items-center gap-3">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-gray-50">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Foto siswa" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-300"><User className="h-8 w-8" /></div>
            )}
          </div>
          <div className="min-w-0">
            <p className="mb-1 text-xs text-gray-500">Foto</p>
            <label className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${locked ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-gray-50"}`}>
              <Upload className="h-4 w-4 text-gray-500" /> Pilih foto
              <input
                name="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={locked}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPreview(URL.createObjectURL(f));
                }}
              />
            </label>
            <p className="mt-1 text-xs text-gray-400">JPG/PNG/WebP, maks 2 MB.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tempat Lahir" name="birthPlace" defaultValue={profile.birthPlace} disabled={locked} required />
          <Field label="Tanggal Lahir" name="birthDate" type="date" defaultValue={profile.birthDate} disabled={locked} required />
          <Field label="Nomor Orang Tua / Wali" name="parentPhone" type="tel" inputMode="tel" placeholder="081234567890" defaultValue={profile.parentPhone} disabled={locked} required />
          <div className="sm:col-span-2">
            <Label htmlFor="address" className="mb-1 text-xs text-gray-500">Alamat <span className="text-red-500">*</span></Label>
            <Textarea id="address" name="address" defaultValue={profile.address} disabled={locked} required rows={3} placeholder="Jalan, RT/RW, desa/kelurahan, kecamatan, kota" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="medicalHistory" className="mb-1 text-xs text-gray-500">Riwayat Penyakit</Label>
            <Textarea id="medicalHistory" name="medicalHistory" defaultValue={profile.medicalHistory} disabled={locked} rows={3} placeholder="Contoh: asma, alergi obat tertentu. Kosongkan bila tidak ada." />
            <p className="mt-1 text-xs text-gray-400">Hanya dibaca guru BK dan petugas UKS untuk penanganan darurat.</p>
          </div>
        </div>
      </section>

      {msg && (
        <p className={`rounded-lg px-3 py-2 text-sm ${msg.type === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {msg.text}
        </p>
      )}

      {!locked && (
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Menyimpan..." : profile.status === "REJECTED" ? "Kirim Ulang" : "Kirim ke Guru BK"}
        </Button>
      )}
    </form>
  );
}

function Field({ label, name, defaultValue, disabled, required, ...rest }: {
  label: string; name: string; defaultValue: string; disabled: boolean; required?: boolean;
} & React.ComponentProps<typeof Input>) {
  return (
    <div>
      <Label htmlFor={name} className="mb-1 text-xs text-gray-500">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input id={name} name={name} defaultValue={defaultValue} disabled={disabled} required={required} {...rest} />
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
