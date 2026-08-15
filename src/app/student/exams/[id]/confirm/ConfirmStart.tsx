"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ClipboardList, Clock, BookOpen, User, School, AlertTriangle, ArrowRight,
  Wifi, Save, DoorClosed, Timer,
} from "lucide-react";
import { startAttempt } from "../actions";
import { LOCK_THRESHOLD } from "@/lib/exam-lock";

const rules: { icon: typeof Wifi; bg: string; text: string }[] = [
  { icon: Wifi, bg: "bg-blue-50", text: "Pastikan koneksi internet stabil selama ujian berlangsung." },
  { icon: Save, bg: "bg-emerald-50", text: "Jawaban tersimpan otomatis setiap kali memilih jawaban." },
  { icon: DoorClosed, bg: "bg-red-50", text: `Keluar dari halaman ujian ${LOCK_THRESHOLD}× membuat ujian terkunci.` },
  { icon: Timer, bg: "bg-indigo-50", text: "Waktu habis? Jawaban otomatis dikumpulkan." },
  { icon: AlertTriangle, bg: "bg-amber-50", text: "Tandai soal yang ragu-ragu untuk ditinjau kembali." },
  { icon: ClipboardList, bg: "bg-amber-50", text: "Klik tombol Selesai Ujian untuk mengakhiri ujian." },
  { icon: AlertTriangle, bg: "bg-amber-50", text: "Tidak diperkenankan membuka tab/aplikasi lain." },
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
      <div className="mb-4 rounded-2xl bg-gradient-to-br from-[#1D4ED8] to-[#3B82F6] p-5 text-center text-white shadow-[0_16px_40px_-20px_rgba(29,78,216,0.55)]">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-white/75">Token Terverifikasi</p>
        <h1 className="font-heading mt-1 text-xl font-bold">{title}</h1>
        <div className="mt-4 flex items-center justify-center gap-4 font-mono text-[17px]">
          <span>{duration} menit</span>
          <span className="h-4 w-px bg-white/30" />
          <span>{questions} soal</span>
          <span className="h-4 w-px bg-white/30" />
          <span>Batas keluar {LOCK_THRESHOLD}×</span>
        </div>
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
              <p className="text-xs text-gray-400">Mapel</p>
              <p className="font-medium text-gray-800">{subjectName}</p>
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

      <div className="mb-5 rounded-xl border bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-gray-700">Tata Tertib Ujian</p>
        <div className="space-y-2.5">
          {rules.map((rule, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px] ${rule.bg}`}>
                <rule.icon className="h-4 w-4 text-gray-600" />
              </span>
              <p className="text-[13px] text-gray-700">{rule.text}</p>
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={handleStart}
        disabled={pending}
        className="w-full h-12 bg-brand hover:bg-brand-strong font-semibold text-base gap-2"
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
