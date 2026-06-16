"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw, RotateCcw, Monitor, Clock, CheckCircle, AlertCircle, Wifi, WifiOff,
} from "lucide-react";
import { resetStudentLogin } from "./actions";
import { useConfirm } from "@/components/ConfirmDialog";

type Exam = {
  id: string;
  title: string;
  durationMinutes: number;
  startAt: Date;
  endAt: Date;
  subject: { code: string; name: string };
  teacher: { user: { name: string } };
  _count: { questions: number };
};

type StudentRow = {
  id: string;
  nis: string | null;
  user: { name: string; isActive: boolean };
  class: { name: string } | null;
  attempts: {
    id: string;
    status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED";
    startedAt: Date | null;
    submittedAt: Date | null;
    score: number | null;
    loginStatus: boolean;
    _count: { answers: number };
  }[];
};

type ExamOption = { id: string; title: string; subject: { code: string } };

const statusInfo = {
  IN_PROGRESS:    { label: "Mengerjakan", color: "bg-green-100 text-green-700 border-green-200", icon: Monitor },
  SUBMITTED:      { label: "Selesai",     color: "bg-blue-100 text-blue-700 border-blue-200",     icon: CheckCircle },
  AUTO_SUBMITTED: { label: "Auto Submit", color: "bg-purple-100 text-purple-700 border-purple-200", icon: CheckCircle },
  NOT_STARTED:    { label: "Belum Mulai", color: "bg-gray-100 text-gray-600 border-gray-200",     icon: Clock },
} as const;

function fmtTime(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function MonitoringClient({
  exam, students, exams,
}: { exam: Exam; students: StudentRow[]; exams: ExamOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function changeExam(id: string) {
    const sp = new URLSearchParams(searchParams);
    sp.set("examId", id);
    router.push(`/admin/monitoring?${sp.toString()}`);
  }

  function refresh() {
    router.refresh();
  }

  function handleReset(attemptId: string, name: string) {
    startTransition(async () => {
      if (!(await confirm(`Reset login siswa "${name}"? Status akan kembali ke "Belum Mulai".`))) return;
      const r = await resetStudentLogin(attemptId);
      if (r.error) alert(r.error);
    });
  }

  // Hitung statistik
  const rows = students.map((s) => {
    const att = s.attempts[0];
    const status = att?.status ?? "NOT_STARTED";
    return { ...s, attempt: att, statusKey: status };
  });

  const counts = {
    inProgress: rows.filter((r) => r.statusKey === "IN_PROGRESS").length,
    submitted:  rows.filter((r) => r.statusKey === "SUBMITTED" || r.statusKey === "AUTO_SUBMITTED").length,
    notStarted: rows.filter((r) => r.statusKey === "NOT_STARTED").length,
  };

  return (
    <>
      {/* Top bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Monitoring Ujian</h1>
          <p className="text-sm text-gray-500">{exam.title}</p>
        </div>
        <div className="flex gap-2">
          <Select value={exam.id} onValueChange={changeExam}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              {exams.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.subject.code} – {e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />Refresh
          </Button>
        </div>
      </div>

      {/* Exam info */}
      <div className="mb-6 rounded-xl border bg-blue-50 border-blue-100 p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-gray-500">Pengawas</p>
            <p className="font-semibold text-gray-800">{exam.teacher.user.name}</p>
          </div>
          <div>
            <p className="text-gray-500">Mata Pelajaran</p>
            <p className="font-semibold text-gray-800">{exam.subject.name}</p>
          </div>
          <div>
            <p className="text-gray-500">Durasi</p>
            <p className="font-semibold text-gray-800">{exam.durationMinutes} menit</p>
          </div>
          <div>
            <p className="text-gray-500">Jumlah Soal</p>
            <p className="font-semibold text-gray-800">{exam._count.questions} soal</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total Peserta", value: students.length, color: "text-gray-700", bg: "bg-gray-50", icon: Monitor },
          { label: "Mengerjakan", value: counts.inProgress, color: "text-green-600", bg: "bg-green-50", icon: Wifi },
          { label: "Selesai Submit", value: counts.submitted, color: "text-blue-600", bg: "bg-blue-50", icon: CheckCircle },
          { label: "Belum Mulai", value: counts.notStarted, color: "text-gray-600", bg: "bg-gray-50", icon: Clock },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border ${s.bg} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
              <s.icon className={`h-6 w-6 ${s.color} opacity-60`} />
            </div>
          </div>
        ))}
      </div>

      {/* Participant cards */}
      {students.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada siswa di kelas peserta. Atur kelas peserta saat edit jadwal ujian.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => {
            const info = statusInfo[r.statusKey];
            const totalQ = exam._count.questions;
            const answered = r.attempt?._count.answers ?? 0;
            const progress = totalQ > 0 ? (answered / totalQ) * 100 : 0;
            return (
              <div key={r.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{r.user.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{r.nis ?? r.id.slice(0, 8)} · {r.class?.name ?? "—"}</p>
                  </div>
                  <Badge className={`${info.color} hover:${info.color} text-xs shrink-0`}>
                    {r.statusKey === "IN_PROGRESS" && "● "}{info.label}
                  </Badge>
                </div>

                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                    <span>Progress</span>
                    <span className="font-medium">{answered}/{totalQ} soal</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div>
                    <span className="block text-gray-400">Mulai</span>
                    <span className="font-medium text-gray-700">{fmtTime(r.attempt?.startedAt ?? null)}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400">{r.statusKey === "IN_PROGRESS" ? "Status Login" : "Submit"}</span>
                    {r.statusKey === "IN_PROGRESS" ? (
                      <span className="font-medium text-green-600 flex items-center gap-1">
                        {r.attempt?.loginStatus ? <><Wifi className="h-3 w-3" />Online</> : <><WifiOff className="h-3 w-3" />Offline</>}
                      </span>
                    ) : (
                      <span className="font-medium text-blue-600">
                        {fmtTime(r.attempt?.submittedAt ?? null)}
                        {r.attempt?.score !== null && r.attempt?.score !== undefined && (
                          <span className="ml-2 text-purple-600">· {r.attempt.score}</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {r.attempt && r.statusKey !== "SUBMITTED" && r.statusKey !== "AUTO_SUBMITTED" && (
                  <Button
                    variant="outline" size="sm"
                    className="mt-3 w-full gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50 text-xs"
                    onClick={() => handleReset(r.attempt!.id, r.user.name)}
                    disabled={pending}
                  >
                    <RotateCcw className="h-3 w-3" />Reset Login
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
