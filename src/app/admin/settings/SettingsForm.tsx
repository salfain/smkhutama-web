"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Database, HardDrive, CheckCircle } from "lucide-react";
import { saveSettings, backupDatabase, type Settings } from "./actions";

const checkboxOptions: { key: keyof Settings; label: string }[] = [
  { key: "enable_doubtful", label: "Aktifkan fitur ragu-ragu" },
  { key: "show_question_numbers", label: "Tampilkan nomor soal di samping" },
  { key: "allow_free_navigation", label: "Izinkan navigasi soal bebas" },
  { key: "auto_submit_on_timeout", label: "Auto submit saat waktu habis" },
  { key: "show_result_default", label: "Tampilkan nilai langsung setelah ujian (default)" },
];

export function SettingsForm({ settings }: { settings: Settings }) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [backupResult, setBackupResult] = useState<{ users: number; exams: number; attempts: number; ts: string } | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(""); setSuccess(false);
    startTransition(async () => {
      const r = await saveSettings(formData);
      if (r.error) setError(r.error); else setSuccess(true);
    });
  }

  function handleBackup() {
    startTransition(async () => {
      const r = await backupDatabase();
      if (r.success) setBackupResult({
        users: r.stats.users, exams: r.stats.exams,
        attempts: r.stats.attempts,
        ts: new Date(r.timestamp).toLocaleString("id-ID"),
      });
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5 max-w-2xl">
      {/* Upload */}
      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <p className="font-semibold text-gray-700">Batas Upload File</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="max_image_size">Max Gambar (KB)</Label>
            <Input id="max_image_size" name="max_image_size" type="number" min="1" defaultValue={settings.max_image_size} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max_audio_size">Max Audio (KB)</Label>
            <Input id="max_audio_size" name="max_audio_size" type="number" min="1" defaultValue={settings.max_audio_size} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max_video_size">Max Video (KB)</Label>
            <Input id="max_video_size" name="max_video_size" type="number" min="1" defaultValue={settings.max_video_size} />
          </div>
        </div>
      </div>

      {/* Exam */}
      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <p className="font-semibold text-gray-700">Pengaturan Ujian</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="autosave_interval">Auto Save Interval (detik)</Label>
            <Input id="autosave_interval" name="autosave_interval" type="number" min="5" defaultValue={settings.autosave_interval} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="default_exam_duration">Default Durasi Ujian (menit)</Label>
            <Input id="default_exam_duration" name="default_exam_duration" type="number" min="1" defaultValue={settings.default_exam_duration} />
          </div>
        </div>
        <div className="space-y-3">
          {checkboxOptions.map((opt) => (
            <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name={opt.key} defaultChecked={settings[opt.key] === "true"} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Backup */}
      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <p className="font-semibold text-gray-700 flex items-center gap-2">
          <Database className="h-4 w-4 text-blue-600" />Status Database
        </p>
        {backupResult && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
            <p className="font-semibold mb-1">Snapshot {backupResult.ts}</p>
            <p className="text-xs">{backupResult.users} users · {backupResult.exams} ujian · {backupResult.attempts} percobaan ujian</p>
          </div>
        )}
        <div className="flex items-center justify-between rounded-lg bg-gray-50 border p-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Cek Status Database</p>
            <p className="text-xs text-gray-500">Validasi koneksi & jumlah record terkini</p>
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleBackup} disabled={pending}>
            <HardDrive className="h-4 w-4" />Cek Sekarang
          </Button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">{error}</p>}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" />Pengaturan berhasil disimpan
        </div>
      )}

      <Button type="submit" className="gap-2 bg-blue-600 hover:bg-blue-700" disabled={pending}>
        <Save className="h-4 w-4" />{pending ? "Menyimpan..." : "Simpan Pengaturan"}
      </Button>
    </form>
  );
}
