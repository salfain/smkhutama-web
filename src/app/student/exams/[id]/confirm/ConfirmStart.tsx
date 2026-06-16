"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ClipboardList, Clock, BookOpen, User, School, AlertTriangle, ArrowRight,
} from "lucide-react";
import { startAttempt } from "../actions";

const rules = [
  "Pastikan koneksi internet stabil selama ujian berlangsung.",
  "Jawaban tersimpan otomatis setiap kali memilih jawaban.",
  "Jangan menutup browser atau tab selama ujian.",
  "Tandai soal yang ragu-ragu untuk ditinjau kembali.",
  "Klik tombol Selesai Ujian untuk mengakhiri ujian.",
  "Jika waktu habis, jawaban akan tersubmit otomatis.",
  "Tidak diperkenankan membuka tab/aplikasi lain.",
];

type Props = {
  examId: string; title: string; subjectName: string;
  studentName: string; className: string;
  questions: number; duration: number;
  startAt: Date; endAt: Date;
  isResume: boolean;
};

export function ConfirmStart({
  examId, title, subjectName, studentName, className,
  questions, duration, startAt, endAt, isResume,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleStart() {
    startTransition(async () => {
      const r = await startAttempt(examId);
      if ("error" in r) { alert(r.error); return; }
      router.push(`/student/exams/${examId}/test`);
    });
  }

  const fmtTime = (d: Date) => new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="mx-auto max-w-xl p-4 md:p-6">
      <div className="mb-4 rounded-xl border-2 border-blue-200 bg-blue-50 p-4 text-center">
        <ClipboardList className="mx-auto mb-2 h-8 w-8 text-blue-600" />
        <h1 className="font-heading text-xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500">{subjectName}</p>
      </div>

      <div className="mb-4 rounded-xl border bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-gray-700">Informasi Peserta & Ujian</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <User className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Nama</p>
              <p className="font-medium text-gray-800">{studentName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <School className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Kelas</p>
              <p className="font-medium text-gray-800">{className}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <BookOpen className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Jumlah Soal</p>
              <p className="font-medium text-gray-800">{questions} soal</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Durasi</p>
              <p className="font-medium text-gray-800">{duration} menit</p>
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Waktu Ujian</p>
              <p className="font-medium text-gray-800">{fmtTime(startAt)} – {fmtTime(endAt)} WIB</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <p className="text-sm font-semibold text-yellow-800">Tata Tertib Ujian</p>
        </div>
        <ol className="space-y-1.5">
          {rules.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-yellow-800">
              <span className="shrink-0 font-bold">{i + 1}.</span>{r}
            </li>
          ))}
        </ol>
      </div>

      <Button
        onClick={handleStart}
        disabled={pending}
        className="w-full h-12 bg-orange-500 hover:bg-orange-600 font-semibold text-base gap-2"
      >
        {pending ? "Memuat..." : (
          <>
            {isResume ? "Lanjutkan Ujian" : "Mulai Ujian Sekarang"}
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </Button>
      <p className="mt-2 text-center text-xs text-gray-400">
        Dengan memulai ujian, Anda menyetujui tata tertib di atas.
      </p>
    </div>
  );
}
