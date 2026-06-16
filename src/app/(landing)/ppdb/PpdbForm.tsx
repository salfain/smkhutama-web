"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, AlertCircle, Copy, Check, User, Phone, GraduationCap, Sparkles } from "lucide-react";
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
      <div className="rounded-3xl border border-green-200 dark:border-green-800 bg-white dark:bg-slate-800 p-8 md:p-12 text-center shadow-xl animate-scale-in">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
          Pendaftaran Berhasil! 🎉
        </h2>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Simpan nomor pendaftaran Anda untuk konfirmasi selanjutnya.
        </p>
        <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 px-6 py-4">
          <span className="font-mono text-2xl md:text-3xl font-bold tracking-wider text-blue-700 dark:text-blue-300">{success}</span>
          <button onClick={() => { navigator.clipboard.writeText(success); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="rounded-lg p-2 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors text-slate-400 hover:text-blue-600">
            {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
          </button>
        </div>
        <div className="mt-8 rounded-xl bg-slate-50 dark:bg-slate-700/50 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            📱 Panitia akan menghubungi Anda via WhatsApp untuk verifikasi dan informasi selanjutnya. Terima kasih telah mendaftar di SMK Hutama!
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Section 1: Data Pribadi */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 md:p-8 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">Data Calon Siswa</h3>
            <p className="text-xs text-slate-400">Isi sesuai dokumen resmi</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="fullName" className="text-slate-700 dark:text-slate-300">Nama Lengkap <span className="text-red-500">*</span></Label>
            <Input id="fullName" name="fullName" placeholder="Nama sesuai ijazah" required className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nisn" className="text-slate-700 dark:text-slate-300">NISN</Label>
            <Input id="nisn" name="nisn" placeholder="Nomor Induk Siswa Nasional" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-700 dark:text-slate-300">Jenis Kelamin</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Pilih —</SelectItem>
                <SelectItem value="MALE">Laki-laki</SelectItem>
                <SelectItem value="FEMALE">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="birthPlace" className="text-slate-700 dark:text-slate-300">Tempat Lahir</Label>
            <Input id="birthPlace" name="birthPlace" placeholder="Kota kelahiran" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="birthDate" className="text-slate-700 dark:text-slate-300">Tanggal Lahir</Label>
            <Input id="birthDate" name="birthDate" type="date" className="h-11 rounded-xl" />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="address" className="text-slate-700 dark:text-slate-300">Alamat Lengkap</Label>
            <Textarea id="address" name="address" rows={3} placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota" className="rounded-xl" />
          </div>
        </div>
      </div>

      {/* Section 2: Pendidikan */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 md:p-8 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
            <GraduationCap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">Asal Sekolah & Jurusan</h3>
            <p className="text-xs text-slate-400">Pilih program keahlian yang diminati</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="originSchool" className="text-slate-700 dark:text-slate-300">Asal Sekolah (SMP/MTs)</Label>
            <Input id="originSchool" name="originSchool" placeholder="Nama sekolah asal" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-700 dark:text-slate-300">Pilihan Jurusan <span className="text-red-500">*</span></Label>
            <Select value={major} onValueChange={setMajor}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Pilih jurusan" /></SelectTrigger>
              <SelectContent>
                {majors.map((m) => (
                  <SelectItem key={m.code} value={m.code}>
                    <span className="font-semibold">{m.code}</span> – {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Section 3: Kontak */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 md:p-8 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
            <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">Informasi Kontak</h3>
            <p className="text-xs text-slate-400">Untuk komunikasi selama proses PPDB</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">No. HP / WhatsApp <span className="text-red-500">*</span></Label>
            <Input id="phone" name="phone" placeholder="08xxxxxxxxxx" required className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email</Label>
            <Input id="email" name="email" type="email" placeholder="email@contoh.com (opsional)" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="parentName" className="text-slate-700 dark:text-slate-300">Nama Orang Tua / Wali</Label>
            <Input id="parentName" name="parentName" placeholder="Nama lengkap wali" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="parentPhone" className="text-slate-700 dark:text-slate-300">No. HP Orang Tua</Label>
            <Input id="parentPhone" name="parentPhone" placeholder="08xxxxxxxxxx" className="h-11 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-5 py-4 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 md:p-8 shadow-sm">
        <Button type="submit" size="lg"
          className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
          disabled={pending}
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Mengirim pendaftaran...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Kirim Pendaftaran
            </span>
          )}
        </Button>
        <p className="mt-4 text-center text-xs text-slate-400">
          Dengan mendaftar, Anda menyetujui data digunakan untuk proses Penerimaan Peserta Didik Baru SMK Hutama.
        </p>
      </div>
    </form>
  );
}
