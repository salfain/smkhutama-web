"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw, RotateCcw, Monitor, Clock, CheckCircle, AlertCircle, Wifi, WifiOff,
  Lock, Unlock, Send, Users, Filter,
} from "lucide-react";
import { resetStudentLogin, unlockAttempt, forceSubmitAttempt } from "./actions";
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
    isLocked: boolean;
    violationCount: number;
    lockReason: string | null;
    _count: { answers: number };
  }[];
};

type ExamOption = { id: string; title: string; subject: { code: string } };

type StatusFilter = "ALL" | "IN_PROGRESS" | "LOCKED" | "SUBMITTED" | "NOT_STARTED";

const statusInfo = {
  IN_PROGRESS:    { label: "Mengerjakan",  color: "bg-green-100 text-green-700 border-green-200",    icon: Monitor },
  SUBMITTED:      { label: "Selesai",      color: "bg-blue-100 text-blue-700 border-blue-200",       icon: CheckCircle },
  AUTO_SUBMITTED: { label: "Auto Submit",  color: "bg-purple-100 text-purple-700 border-purple-200", icon: CheckCircle },
  NOT_STARTED:    { label: "Belum Mulai",  color: "bg-gray-100 text-gray-600 border-gray-200",       icon: Clock },
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

  // Filter state
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  function changeExam(id: string) {
    const sp = new URLSearchParams(searchParams);
    sp.set("examId", id);
    // Reset filter saat ganti ujian
    setSelectedClass("ALL");
    setStatusFilter("ALL");
    router.push(`/admin/monitoring?${sp.toString()}`);
  }

  function refresh() { router.refresh(); }

  async function handleReset(attemptId: string, name: string) {
    if (!(await confirm(`Reset login siswa "${name}"? Status akan kembali ke "Belum Mulai".`))) return;
    startTransition(async () => {
      const r = await resetStudentLogin(attemptId);
      if (r.error) alert(r.error);
    });
  }

  async function handleUnlock(attemptId: string, name: string) {
    if (!(await confirm({
      title: "Buka kunci ujian?",
      description: `Siswa "${name}" akan dapat melanjutkan ujian. Counter pelanggaran direset.`,
      confirmText: "Ya, Buka Kunci",
      variant: "info", icon: "info",
    }))) return;
    startTransition(async () => {
      const r = await unlockAttempt(attemptId);
      if (r.error) alert(r.error);
    });
  }

  async function handleForceSubmit(attemptId: string, name: string) {
    if (!(await confirm({
      title: "Submit paksa?",
      description: `Ujian "${name}" akan dikumpulkan dengan jawaban yang sudah ada. Tindakan ini tidak bisa dibatalkan.`,
      confirmText: "Submit Paksa", variant: "danger", icon: "warning",
    }))) return;
    startTransition(async () => {
      const r = await forceSubmitAttempt(attemptId);
      if (r.error) alert(r.error);
    });
  }

  // Buat rows dengan statusKey + isLocked shortcut
  const rows = students.map((s) => {
    const att = s.attempts[0];
    const status = att?.status ?? "NOT_STARTED";
    const isLocked = att?.isLocked === true && status === "IN_PROGRESS";
    return { ...s, attempt: att, statusKey: status, isLocked };
  });

  // Daftar kelas unik di ujian ini (urut alfabet)
  const classNames = Array.from(
    new Set(rows.map((r) => r.class?.name ?? "—"))
  ).sort();

  // Hitung statistik TOTAL (semua kelas, untuk summary cards)
  const totalCounts = {
    total:      rows.length,
    inProgress: rows.filter((r) => r.statusKey === "IN_PROGRESS").length,
    submitted:  rows.filter((r) => r.statusKey === "SUBMITTED" || r.statusKey === "AUTO_SUBMITTED").length,
    notStarted: rows.filter((r) => r.statusKey === "NOT_STARTED").length,
    locked:     rows.filter((r) => r.isLocked).length,
  };

  // Terapkan filter kelas + filter status
  const filtered = rows.filter((r) => {
    const classMatch = selectedClass === "ALL" || (r.class?.name ?? "—") === selectedClass;
    const statusMatch =
      statusFilter === "ALL" ? true
      : statusFilter === "IN_PROGRESS" ? r.statusKey === "IN_PROGRESS" && !r.isLocked
      : statusFilter === "LOCKED"      ? r.isLocked
      : statusFilter === "SUBMITTED"   ? (r.statusKey === "SUBMITTED" || r.statusKey === "AUTO_SUBMITTED")
      : statusFilter === "NOT_STARTED" ? r.statusKey === "NOT_STARTED"
      : true;
    return classMatch && statusMatch;
  });

  // Kelompokkan hasil filter berdasarkan kelas
  const groupedByClass = classNames
    .map((cls) => ({
      name: cls,
      items: filtered.filter((r) => (r.class?.name ?? "—") === cls),
    }))
    .filter((g) => g.items.length > 0);

  // Statistik per kelas (untuk badge di tab pill)
  function classStats(cls: string) {
    const clsRows = rows.filter((r) => (r.class?.name ?? "—") === cls);
    return {
      total:      clsRows.length,
      inProgress: clsRows.filter((r) => r.statusKey === "IN_PROGRESS").length,
      locked:     clsRows.filter((r) => r.isLocked).length,
      submitted:  clsRows.filter((r) => r.statusKey === "SUBMITTED" || r.statusKey === "AUTO_SUBMITTED").length,
    };
  }

  const totalQ = exam._count.questions;

  return (
    <>
      {/* Top bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Monitoring Ujian</h1>
          <p className="text-sm text-gray-500">{exam.title}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={exam.id} onValueChange={changeExam}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              {exams.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.subject.code} – {e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="w-full sm:w-auto gap-1.5" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />Refresh
          </Button>
        </div>
      </div>

      {/* Exam info */}
      <div className="mb-6 rounded-xl border bg-blue-50 border-blue-100 p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
          <div><p className="text-gray-500">Pengawas</p><p className="font-semibold text-gray-800">{exam.teacher.user.name}</p></div>
          <div><p className="text-gray-500">Mata Pelajaran</p><p className="font-semibold text-gray-800">{exam.subject.name}</p></div>
          <div><p className="text-gray-500">Durasi</p><p className="font-semibold text-gray-800">{exam.durationMinutes} menit</p></div>
          <div><p className="text-gray-500">Jumlah Soal</p><p className="font-semibold text-gray-800">{totalQ} soal</p></div>
        </div>
      </div>

      {/* Summary cards — selalu total semua kelas */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: "Total Peserta", value: totalCounts.total,      color: "text-gray-700",  bg: "bg-gray-50",  icon: Monitor,       filter: "ALL" as StatusFilter },
          { label: "Mengerjakan",   value: totalCounts.inProgress, color: "text-green-600", bg: "bg-green-50", icon: Wifi,          filter: "IN_PROGRESS" as StatusFilter },
          { label: "Terkunci",      value: totalCounts.locked,     color: "text-red-600",   bg: "bg-red-50",   icon: Lock,          filter: "LOCKED" as StatusFilter },
          { label: "Selesai Submit",value: totalCounts.submitted,  color: "text-blue-600",  bg: "bg-blue-50",  icon: CheckCircle,   filter: "SUBMITTED" as StatusFilter },
          { label: "Belum Mulai",   value: totalCounts.notStarted, color: "text-gray-600",  bg: "bg-gray-50",  icon: Clock,         filter: "NOT_STARTED" as StatusFilter },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setStatusFilter(statusFilter === s.filter ? "ALL" : s.filter)}
            className={`rounded-xl border ${s.bg} p-4 text-left transition-all ${
              statusFilter === s.filter ? "ring-2 ring-offset-1 ring-blue-400" : "hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
              <s.icon className={`h-6 w-6 ${s.color} opacity-60`} />
            </div>
          </button>
        ))}
      </div>

      {/* Filter bar: tab kelas + dropdown status */}
      {students.length > 0 && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Tab pill kelas */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedClass("ALL")}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                selectedClass === "ALL"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}
            >
              <Users className="h-3 w-3" />
              Semua Kelas
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${selectedClass === "ALL" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                {rows.length}
              </span>
            </button>
            {classNames.map((cls) => {
              const cs = classStats(cls);
              const isActive = selectedClass === cls;
              return (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {cls}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {cs.total}
                  </span>
                  {cs.locked > 0 && (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {cs.locked}🔒
                    </span>
                  )}
                  {cs.inProgress > 0 && cs.locked === 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? "bg-green-300 text-green-900" : "bg-green-100 text-green-700"}`}>
                      {cs.inProgress}●
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Dropdown filter status */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 mt-2 sm:mt-0">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="IN_PROGRESS">Sedang Mengerjakan</SelectItem>
                <SelectItem value="LOCKED">Terkunci</SelectItem>
                <SelectItem value="SUBMITTED">Sudah Submit</SelectItem>
                <SelectItem value="NOT_STARTED">Belum Mulai</SelectItem>
              </SelectContent>
            </Select>
            {(selectedClass !== "ALL" || statusFilter !== "ALL") && (
              <Button
                variant="ghost" size="sm"
                className="h-8 text-xs text-gray-500 hover:text-gray-800"
                onClick={() => { setSelectedClass("ALL"); setStatusFilter("ALL"); }}
              >
                Reset
              </Button>
            )}
            <span className="text-xs text-gray-400">{filtered.length} siswa</span>
          </div>
        </div>
      )}

      {/* Participant cards — dikelompokkan per kelas */}
      {students.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada siswa di kelas peserta. Atur kelas peserta saat edit jadwal ujian.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
          <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Tidak ada siswa yang sesuai filter.</p>
          <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => { setSelectedClass("ALL"); setStatusFilter("ALL"); }}>
            Reset filter
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByClass.map((group) => {
            const groupLocked   = group.items.filter((r) => r.isLocked).length;
            const groupProgress = group.items.filter((r) => r.statusKey === "IN_PROGRESS").length;
            const groupDone     = group.items.filter((r) => r.statusKey === "SUBMITTED" || r.statusKey === "AUTO_SUBMITTED").length;
            return (
              <div key={group.name}>
                {/* Section header kelas */}
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 text-sm">{group.name}</span>
                    <span className="text-xs text-gray-400">{group.items.length} siswa</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {groupProgress > 0 && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                        {groupProgress} mengerjakan
                      </span>
                    )}
                    {groupLocked > 0 && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                        {groupLocked} terkunci
                      </span>
                    )}
                    {groupDone > 0 && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                        {groupDone} selesai
                      </span>
                    )}
                  </div>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((r) => {
                    const info = statusInfo[r.statusKey as keyof typeof statusInfo];
                    const answered = r.attempt?._count.answers ?? 0;
                    const progress = totalQ > 0 ? (answered / totalQ) * 100 : 0;
                    return (
                      <div key={r.id} className={`rounded-xl border bg-white p-4 shadow-sm ${r.isLocked ? "ring-2 ring-red-300 border-red-300" : ""}`}>
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-semibold text-gray-900 truncate">{r.user.name}</p>
                            <p className="text-xs text-gray-400 font-mono truncate">{r.nis ?? r.id.slice(0, 8)}</p>
                          </div>
                          <div className="flex flex-col gap-1 items-end shrink-0">
                            <Badge className={`${info.color} hover:${info.color} text-xs`}>
                              {r.statusKey === "IN_PROGRESS" && "● "}{info.label}
                            </Badge>
                            {r.isLocked && (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 text-[10px] gap-1">
                                <Lock className="h-3 w-3" />Terkunci
                              </Badge>
                            )}
                          </div>
                        </div>

                        {r.isLocked && (
                          <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                            <p className="font-semibold">Akses dikunci anti-cheat</p>
                            <p className="text-[11px] mt-0.5">{r.attempt?.lockReason ?? "Pelanggaran berulang"} · {r.attempt?.violationCount ?? 0}× pelanggaran</p>
                          </div>
                        )}

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
                          <div className="mt-3 grid gap-1.5">
                            {r.isLocked && (
                              <div className="grid grid-cols-2 gap-1.5">
                                <Button
                                  variant="outline" size="sm"
                                  className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50 text-xs"
                                  onClick={() => handleUnlock(r.attempt!.id, r.user.name)}
                                  disabled={pending}
                                >
                                  <Unlock className="h-3 w-3" />Buka Kunci
                                </Button>
                                <Button
                                  variant="outline" size="sm"
                                  className="gap-1.5 text-red-700 border-red-300 hover:bg-red-50 text-xs"
                                  onClick={() => handleForceSubmit(r.attempt!.id, r.user.name)}
                                  disabled={pending}
                                >
                                  <Send className="h-3 w-3" />Submit Paksa
                                </Button>
                              </div>
                            )}
                            <Button
                              variant="outline" size="sm"
                              className="w-full gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 text-xs"
                              onClick={() => handleReset(r.attempt!.id, r.user.name)}
                              disabled={pending}
                            >
                              <RotateCcw className="h-3 w-3" />Reset Login
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
