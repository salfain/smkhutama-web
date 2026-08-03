"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, CheckSquare, ClipboardList, FileText, MonitorCheck, Upload, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  DashboardEmpty,
  DashboardHeader,
  DashboardMetric,
  DashboardPanel,
  DashboardPanelHeader,
  DashboardPill,
  DashboardSectionHeading,
  GenesisDashboard,
} from "@/components/dashboard/GenesisDashboard";

type Data = {
  totalQuestions: number;
  totalExams: number;
  activeExams: number;
  closedExams: number;
  totalParticipants: number;
  pendingEssays: number;
  scoreByClass: { kelas: string; rata: number }[];
  recentExams: {
    id: string;
    title: string;
    status: string;
    startAt: Date;
    subject: { code: string };
    _count: { attempts: number };
  }[];
};

const statusStyle: Record<string, string> = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
  DRAFT: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400",
  CLOSED: "border-[#E8E8EC] bg-[#F5F5F7] text-[#6B6B6B] dark:border-white/10 dark:bg-white/5 dark:text-[#A7A7AE]",
};

const statusText: Record<string, string> = { ACTIVE: "Aktif", DRAFT: "Draft", CLOSED: "Selesai" };
const numberFormat = new Intl.NumberFormat("id-ID");

export function TeacherDashboardClient({ teacherName, subjectName, data }: { teacherName: string; subjectName: string; data: Data | null }) {
  const dashboard = data ?? {
    totalQuestions: 0,
    totalExams: 0,
    activeExams: 0,
    closedExams: 0,
    totalParticipants: 0,
    pendingEssays: 0,
    scoreByClass: [],
    recentExams: [],
  };

  const stats = [
    { label: "Paket Bank Soal", value: dashboard.totalQuestions, icon: FileText, detail: "Paket tersedia" },
    { label: "Total Ujian", value: dashboard.totalExams, icon: ClipboardList, detail: `${dashboard.activeExams} aktif` },
    { label: "Esai Belum Dikoreksi", value: dashboard.pendingEssays, icon: CheckSquare, detail: "Perlu ditinjau", tone: dashboard.pendingEssays > 0 ? "warning" as const : "neutral" as const },
    { label: "Total Peserta", value: dashboard.totalParticipants, icon: Users, detail: "Seluruh ujian" },
  ];

  const actions = (
    <div className="flex flex-wrap gap-2">
      <Link href="/teacher/question-sets" className="inline-flex h-9 items-center gap-2 rounded-md border border-[#E8E8EC] bg-[#FFFFFF] px-3.5 text-xs font-semibold text-[#0A0A0A] transition-all hover:-translate-y-px hover:border-[#D8D8DE] hover:bg-[#FAFAFA] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/15 dark:border-white/10 dark:bg-[#19191C] dark:text-[#F5F5F7] dark:hover:bg-white/5">
        <Upload className="h-3.5 w-3.5" aria-hidden="true" /> Import soal
      </Link>
      <Link href="/teacher/monitoring" className="inline-flex h-9 items-center gap-2 rounded-md bg-brand px-3.5 text-xs font-semibold text-white transition-all hover:-translate-y-px hover:bg-brand-strong hover:shadow-[0_4px_12px_rgba(99,102,241,0.35)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/20">
        <MonitorCheck className="h-3.5 w-3.5" aria-hidden="true" /> Monitoring
      </Link>
    </div>
  );

  return (
    <GenesisDashboard>
      <DashboardHeader
        eyebrow="Ruang kerja guru"
        title="Dashboard Guru"
        description={<>Selamat datang, {teacherName}. Kelola bank soal, ujian, dan evaluasi kelas Anda.</>}
        meta={<DashboardPill>{subjectName}</DashboardPill>}
        status={actions}
      />

      {dashboard.pendingEssays > 0 && (
        <Link href="/teacher/essay-grading" className="mb-8 flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-900 transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(245,158,11,0.18)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-amber-500/15 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          <span className="flex items-center gap-2"><CheckSquare className="h-4 w-4" aria-hidden="true" /> Ada <strong>{dashboard.pendingEssays} jawaban esai</strong> yang belum dikoreksi.</span>
          <span className="inline-flex shrink-0 items-center gap-1 font-semibold">Koreksi <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
        </Link>
      )}

      <section className="mb-10" aria-labelledby="teacher-summary">
        <DashboardSectionHeading title="Ringkasan pengajaran" description="Data ujian dan penilaian mata pelajaran Anda." />
        <div id="teacher-summary" className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-5">
          {stats.map((stat) => <DashboardMetric key={stat.label} {...stat} />)}
        </div>
      </section>

      <section aria-labelledby="teacher-activity">
        <DashboardSectionHeading title="Performa & aktivitas" description="Rata-rata nilai kelas dan ujian yang baru diperbarui." />
        <div id="teacher-activity" className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
          <DashboardPanel>
            <DashboardPanelHeader icon={BarChart3} title="Rata-rata nilai per kelas" description="Perbandingan nilai pada skala 0–100" />
            <div className="p-5">
              {dashboard.scoreByClass.length === 0 ? (
                <DashboardEmpty icon={BarChart3} title="Belum ada data nilai" description="Grafik akan muncul setelah nilai ujian tersedia." className="min-h-[280px]" />
              ) : (
                <div role="img" aria-label="Grafik rata-rata nilai per kelas">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={dashboard.scoreByClass} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} accessibilityLayer>
                      <CartesianGrid vertical={false} stroke="#E8E8EC" strokeDasharray="3 3" />
                      <XAxis dataKey="kelas" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9C9C9C" }} tickMargin={10} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9C9C9C" }} />
                      <Tooltip cursor={{ fill: "rgba(99, 102, 241, 0.06)" }} contentStyle={{ background: "#FFFFFF", border: "1px solid #E8E8EC", borderRadius: 8, boxShadow: "0 10px 30px rgba(0,0,0,0.10)", fontSize: 12 }} />
                      <Bar dataKey="rata" fill="#6B6B6B" activeBar={{ fill: "#B45309" }} radius={[6, 6, 0, 0]} name="Rata-rata" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </DashboardPanel>

          <DashboardPanel>
            <DashboardPanelHeader icon={ClipboardList} title="Ujian terbaru" description="Aktivitas yang terakhir diperbarui" />
            {dashboard.recentExams.length === 0 ? (
              <DashboardEmpty icon={ClipboardList} title="Belum ada ujian" description="Ujian yang dibuat akan tampil di sini." className="min-h-[320px]" />
            ) : (
              <div className="divide-y divide-[#E8E8EC] dark:divide-white/10">
                {dashboard.recentExams.map((exam) => (
                  <div key={exam.id} className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#FAFAFA] dark:hover:bg-white/[0.03]">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#0A0A0A] dark:text-[#F5F5F7]">{exam.title}</p>
                      <p className="mt-1 text-xs text-[#6B6B6B] dark:text-[#A7A7AE]">{exam.subject.code} · {numberFormat.format(exam._count.attempts)} peserta</p>
                      <p className="mt-1 text-[11px] text-[#9C9C9C]">{new Date(exam.startAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusStyle[exam.status] ?? statusStyle.CLOSED}`}>{statusText[exam.status] ?? exam.status}</span>
                  </div>
                ))}
              </div>
            )}
          </DashboardPanel>
        </div>
      </section>
    </GenesisDashboard>
  );
}
