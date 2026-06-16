"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Upload, CheckCircle } from "lucide-react";
import { upsertSchoolProfile } from "./actions";

type Profile = {
  id: string;
  name: string;
  logo: string | null;
  address: string | null;
  npsn: string | null;
  principalName: string | null;
  letterhead: string | null;
} | null;

export function SchoolProfileForm({ profile }: { profile: Profile }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(profile?.logo ?? null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
  }

  async function handleSubmit(formData: FormData) {
    setError("");
    setSuccess(false);
    startTransition(async () => {
      const result = await upsertSchoolProfile(formData);
      if (result.error) setError(result.error);
      else setSuccess(true);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5 max-w-2xl">
      {/* Logo */}
      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
        <p className="font-semibold text-gray-700">Logo Sekolah</p>
        <div className="flex items-center gap-5">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden">
            {logoPreview ? (
              <Image src={logoPreview} alt="Logo" fill className="object-contain p-1" sizes="96px" unoptimized />
            ) : (
              <span className="text-3xl font-bold text-gray-300">S</span>
            )}
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 mb-2"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {logoPreview ? "Ganti Logo" : "Upload Logo"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleLogoChange}
              className="hidden"
            />
            <p className="text-xs text-gray-400">PNG/JPG/WEBP, maks 500KB</p>
          </div>
        </div>
      </div>

      {/* Data Sekolah */}
      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <p className="font-semibold text-gray-700">Data Sekolah</p>
        <div className="space-y-1.5">
          <Label htmlFor="name">Nama Sekolah *</Label>
          <Input id="name" name="name" defaultValue={profile?.name ?? ""} placeholder="cth: SMK HUTAMA" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="npsn">NPSN</Label>
            <Input id="npsn" name="npsn" defaultValue={profile?.npsn ?? ""} placeholder="cth: 20271234" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="principalName">Nama Kepala Sekolah</Label>
            <Input id="principalName" name="principalName" defaultValue={profile?.principalName ?? ""} placeholder="cth: Drs. Ahmad, M.Pd" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Alamat Sekolah</Label>
          <Textarea id="address" name="address" defaultValue={profile?.address ?? ""} rows={2} placeholder="Jl. ..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="letterhead">Kop Surat / Tagline</Label>
          <Input id="letterhead" name="letterhead" defaultValue={profile?.letterhead ?? ""} placeholder="cth: Maju, Cerdas, Berkarakter" />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">{error}</p>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" />
          Profil sekolah berhasil disimpan
        </div>
      )}

      <Button type="submit" className="gap-2 bg-blue-600 hover:bg-blue-700" disabled={pending}>
        <Save className="h-4 w-4" />
        {pending ? "Menyimpan..." : "Simpan Profil Sekolah"}
      </Button>
    </form>
  );
}
