"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";
import { submitRegistration } from "./actions";

type Major = { code: string; name: string };

export function PpdbForm({ majors }: { majors: Major[] }) {
  const [gender, setGender] = useState("none");
  const [major, setMajor] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError("");
    formData.set("gender", gender === "none" ? "" : gender);
    formData.set("selectedMajor", major);
    startTransition(async () => {
      const r = await submitRegistration(formData);
      if (r.error) setError(r.error);
      else if (r.registNumber) setSuccess(r.registNumber);
    });
  }

  if (success) {
    return (
      <div className="rounded-3xl border border-green-200 bg-white p-8 text-center shadow-xl animate-scale-in">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-9 w-9 text-green-600" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-slate-900">Pendaftaran Berhasil!</h2>
        <p className="mt-2 text-sm text-slate-500">Simpan nomor pendaftaran Anda untuk konfirmasi.</p>
        <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-slate-50 border border-dashed px-5 py-4">
          <span className="font-mono text-2xl font-bold tracking-wider text-blue-700">{success}</span>
          <button onClick={() => { navigator.clipboard.writeText(success); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="text-slate-400 hover:text-blue-600">
            {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
          </button>
        </div>
        <p className="mt-5 text-xs text-slate-400">
          Panitia akan menghubungi Anda via WhatsApp untuk verifikasi. Terima kasih.
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl md:p-8 space-y-5">
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-3">Data Calon Siswa</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="fullName">Nama Lengkap *</Label>
            <Input id="fullName" name="fullName" placeholder="Nama sesuai ijazah" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nisn">NISN</Label>
            <Input id="nisn" name="nisn" placeholder="Nomor NISN" />
          </div>
          <div className="space-y-1.5">
            <Label>Jenis Kelamin</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Pilih —</SelectItem>
                <SelectItem value="MALE">Laki-laki</SelectItem>
                <SelectItem value="FEMALE">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="birthPlace">Tempat Lahir</Label>
            <Input id="birthPlace" name="birthPlace" placeholder="Kota kelahiran" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="birthDate">Tanggal Lahir</Label>
            <Input id="birthDate" name="birthDate" type="date" />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="address">Alamat</Label>
            <Textarea id="address" name="address" rows={2} placeholder="Alamat lengkap" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="originSchool">Asal Sekolah (SMP/MTs)</Label>
            <Input id="originSchool" name="originSchool" placeholder="Nama sekolah asal" />
          </div>
          <div className="space-y-1.5">
            <Label>Pilihan Jurusan *</Label>
            <Select value={major} onValueChange={setMajor}>
              <SelectTrigger><SelectValue placeholder="Pilih jurusan" /></SelectTrigger>
              <SelectContent>
                {majors.map((m) => <SelectItem key={m.code} value={m.code}>{m.code} – {m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 mb-3">Kontak</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="phone">No. HP / WhatsApp *</Label>
            <Input id="phone" name="phone" placeholder="08xxxxxxxxxx" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="opsional" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="parentName">Nama Orang Tua/Wali</Label>
            <Input id="parentName" name="parentName" placeholder="Nama wali" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="parentPhone">No. HP Orang Tua</Label>
            <Input id="parentPhone" name="parentPhone" placeholder="08xxxxxxxxxx" />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />{error}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full rounded-full bg-blue-600 hover:bg-blue-700" disabled={pending}>
        {pending ? "Mengirim..." : "Kirim Pendaftaran"}
      </Button>
      <p className="text-center text-xs text-slate-400">
        Dengan mendaftar, Anda menyetujui data digunakan untuk proses PPDB.
      </p>
    </form>
  );
}
