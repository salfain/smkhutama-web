"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, CheckCircle } from "lucide-react";
import { saveProfile } from "../content-actions";

type P = Record<string, unknown> | null;

export function ProfileForm({ profile }: { profile: P }) {
  const [ppdbOpen, setPpdbOpen] = useState((profile?.ppdbOpen as boolean) ?? true);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();
  const v = (k: string) => (profile?.[k] as string) ?? "";

  function submit(fd: FormData) {
    setOk(false); setErr("");
    if (ppdbOpen) fd.set("ppdbOpen", "on"); else fd.delete("ppdbOpen");
    startTransition(async () => {
      const r = await saveProfile(fd);
      if (r.error) setErr(r.error); else setOk(true);
    });
  }

  return (
    <form action={submit} className="max-w-2xl space-y-5">
      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <p className="font-semibold text-gray-700">Identitas Sekolah</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Nama Sekolah</Label><Input name="schoolName" defaultValue={v("schoolName")} /></div>
          <div className="space-y-1.5"><Label>Nama Singkat</Label><Input name="shortName" defaultValue={v("shortName")} /></div>
        </div>
        <div className="space-y-1.5"><Label>Tagline</Label><Input name="tagline" defaultValue={v("tagline")} placeholder="Siap Kerja, Siap Kuliah, Siap Wirausaha" /></div>
        <div className="space-y-1.5"><Label>URL Logo</Label><Input name="logoUrl" defaultValue={v("logoUrl")} placeholder="https://..." /></div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <p className="font-semibold text-gray-700">Konten Hero (Banner Utama)</p>
        <div className="space-y-1.5"><Label>Badge</Label><Input name="heroBadge" defaultValue={v("heroBadge")} placeholder="SMK HUTAMA PONDOK GEDE" /></div>
        <div className="space-y-1.5"><Label>Judul Utama</Label><Textarea name="heroTitle" defaultValue={v("heroTitle")} rows={2} /></div>
        <div className="space-y-1.5"><Label>Subjudul</Label><Textarea name="heroSubtitle" defaultValue={v("heroSubtitle")} rows={2} /></div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <p className="font-semibold text-gray-700">Kontak</p>
        <div className="space-y-1.5"><Label>Alamat</Label><Textarea name="address" defaultValue={v("address")} rows={2} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Telepon</Label><Input name="phone" defaultValue={v("phone")} /></div>
          <div className="space-y-1.5"><Label>WhatsApp</Label><Input name="whatsapp" defaultValue={v("whatsapp")} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input name="email" defaultValue={v("email")} /></div>
          <div className="space-y-1.5"><Label>Website Resmi</Label><Input name="officialUrl" defaultValue={v("officialUrl")} /></div>
          <div className="space-y-1.5"><Label>Instagram</Label><Input name="instagram" defaultValue={v("instagram")} /></div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <p className="font-semibold text-gray-700">Tentang Sekolah (halaman /tentang)</p>
        <div className="space-y-1.5"><Label>Visi</Label><Textarea name="vision" defaultValue={v("vision")} rows={2} placeholder="Visi sekolah..." /></div>
        <div className="space-y-1.5">
          <Label>Misi (satu poin per baris)</Label>
          <Textarea name="mission" defaultValue={v("mission")} rows={4} placeholder={"Menyelenggarakan pendidikan vokasi...\nMembekali siswa dengan keterampilan...\n..."} />
        </div>
        <div className="space-y-1.5"><Label>Sejarah Singkat (opsional)</Label><Textarea name="history" defaultValue={v("history")} rows={3} /></div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <p className="font-semibold text-gray-700">Sambutan Kepala Sekolah</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Nama Kepala Sekolah</Label><Input name="principalName" defaultValue={v("principalName")} /></div>
          <div className="space-y-1.5"><Label>URL Foto Kepala Sekolah</Label><Input name="principalPhoto" defaultValue={v("principalPhoto")} placeholder="https://..." /></div>
        </div>
        <div className="space-y-1.5"><Label>Kata Sambutan</Label><Textarea name="principalWord" defaultValue={v("principalWord")} rows={4} /></div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={ppdbOpen} onChange={(e) => setPpdbOpen(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-gray-700">Pendaftaran PPDB Dibuka</p>
            <p className="text-xs text-gray-500">Jika aktif, tombol & halaman pendaftaran online tampil di beranda</p>
          </div>
        </label>
      </div>

      {err && <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">{err}</p>}
      {ok && <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700"><CheckCircle className="h-4 w-4" />Profil tersimpan</div>}

      <Button type="submit" className="gap-2 bg-blue-600 hover:bg-blue-700" disabled={pending}>
        <Save className="h-4 w-4" />{pending ? "Menyimpan..." : "Simpan Perubahan"}
      </Button>
    </form>
  );
}
