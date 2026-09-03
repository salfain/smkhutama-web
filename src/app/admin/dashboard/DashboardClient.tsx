"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle,
  Clock,
  FileText,
  GraduationCap,
  MonitorCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AdminRole = "ADMIN" | "KURIKULUM" | "KESISWAAN" | "ADMIN_CBT";

type Props = {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    totalSubjects: number;
    totalQuestions: number;
    activeExams: number;
    inProgressAttempts: number;
    submittedAttempts: number;
  };
  recentExams: {
    id: string;
    title: string;
    status: string;
    subject: { name: string };
    teacher: { user: { name: string } };
    _count: { attempts: number };
  }[];
  scoreChartData: { mapel: string; nilai: number }[];
  schoolName: string;
  activeYear: string;
  userName: string;
  role: AdminRole;
};

const roleLabels: Record<AdminRole, string> = {
  ADMIN: "Administrator",
  KURIKULUM: "Kurikulum",
  KESISWAAN: "Kesiswaan",
  ADMIN_CBT: "Admin CBT",
};

const statusStyle: Record<string, string> = {
  ACTIVE:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
  DRAFT:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400",
  CLOSED:
    "border-[#E8E8EC] bg-[#F5F5F7] text-[#6B6B6B] dark:border-white/10 dark:bg-white/5 dark:text-[#A7A7AE]",
};

const statusLabel: Record<string, string> = {
  ACTIVE: "Aktif",
  DRAFT: "Draft",
  CLOSED: "Selesai",
};

const numberFormat = new Intl.NumberFormat("id-ID");

export function DashboardClient({
  stats,
  recentExams,
  scoreChartData,
  schoolName,
  activeYear,
  userName,
  role,
}: Props) {
  const statCards = [
    { title: "Total Siswa", value: stats.totalStudents, icon: Users, detail: "Terdaftar" },
    { title: "Total Guru", value: stats.totalTeachers, icon: GraduationCap, detail: "Aktif" },
    { title: "Total Kelas", value: stats.totalClasses, icon: Building2, detail: "Rombel" },
    { title: "Mata Pelajaran", value: stats.totalSubjects, icon: BookOpen, detail: activeYear },
    { title: "Bank Soal", value: stats.totalQuestions, icon: FileText, detail: "Soal aktif" },
    { title: "Ujian Aktif", value: stats.activeExams, icon: MonitorCheck, detail: "Berlangsung" },
    { title: "Sedang Ujian", value: stats.inProgressAttempts, icon: Clock, detail: "Peserta online" },
    { title: "Ujian Selesai", value: stats.submittedAttempts, icon: CheckCircle, detail: "Tersubmit" },
  ];

  return (
    <div className="genesis-dashboard min-h-full bg-[#FAFAFA] text-[#0A0A0A] dark:bg-[#111113] dark:text-[#F5F5F7]">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="mb-10 flex flex-col gap-5 border-b border-[#E8E8EC] pb-8 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9C9C9C]">
              Ruang kerja {roleLabels[role]}
            </p>
            <h1 className="genesis-heading text-[32px] font-bold leading-[1.08] text-[#0A0A0A] dark:text-[#F5F5F7] sm:text-[40px]">
              Dashboard {roleLabels[role]}
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-6 text-[#6B6B6B] dark:text-[#A7A7AE]">
              Selamat datang, {userName}. Pantau ringkasan akademik dan aktivitas terbaru {schoolName}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="rounded-full border border-[#E8E8EC] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#6B6B6B] dark:border-white/10 dark:bg-[#19191C] dark:text-[#A7A7AE]">
              {activeYear}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Sistem online
            </span>
          </div>
        </header>

        <section aria-labelledby="summary-heading" className="mb-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 id="summary-heading" className="genesis-heading text-2xl font-semibold text-[#0A0A0A] dark:text-[#F5F5F7]">
                Ringkasan sekolah
              </h2>
              <p className="mt-1 text-[13px] text-[#9C9C9C]">Data operasional pada periode aktif.</p>
            </div>
            <p className="hidden text-xs font-medium text-[#9C9C9C] sm:block">8 indikator utama</p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-5">
            {statCards.map((stat) => (
              <Card
                key={stat.title}
                className="rounded-xl border border-[#E8E8EC] bg-[#FFFFFF] py-0 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D8D8DE] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-[#19191C] dark:hover:border-white/20 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.28)]"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="mb-6 flex items-start justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9C9C9C]">
                      {stat.title}
                    </p>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F5F7] text-[#6B6B6B] dark:bg-white/5 dark:text-[#A7A7AE]">
                      <stat.icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>
                  <p className="genesis-heading text-[30px] font-semibold leading-none text-[#0A0A0A] dark:text-[#F5F5F7]">
                    {numberFormat.format(stat.value)}
                  </p>
                  <p className="mt-2 truncate text-xs text-[#9C9C9C]" title={stat.detail}>
                    {stat.detail}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="activity-heading">
          <div className="mb-5">
            <h2 id="activity-heading" className="genesis-heading text-2xl font-semibold text-[#0A0A0A] dark:text-[#F5F5F7]">
              Analitik &amp; aktivitas
            </h2>
            <p className="mt-1 text-[13px] text-[#9C9C9C]">Performa nilai dan ujian yang baru diperbarui.</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
            <Card className="rounded-xl border border-[#E8E8EC] bg-[#FFFFFF] py-0 shadow-none dark:border-white/10 dark:bg-[#19191C]">
              <CardHeader className="flex-row items-center justify-between border-b border-[#E8E8EC] px-5 py-5 dark:border-white/10">
                <div>
                  <CardTitle className="genesis-heading flex items-center gap-2 text-base font-semibold text-[#0A0A0A] dark:text-[#F5F5F7]">
                    <TrendingUp className="h-4 w-4 text-[#6B6B6B] dark:text-[#A7A7AE]" aria-hidden="true" />
                    Rata-rata nilai
                  </CardTitle>
                  <p className="mt-1 text-xs text-[#9C9C9C]">Per mata pelajaran, skala 0-100</p>
                </div>
                <span className="rounded bg-[#F5F5F7] px-2 py-1 text-[11px] font-medium text-[#6B6B6B] dark:bg-white/5 dark:text-[#A7A7AE]">
                  Nilai
                </span>
              </CardHeader>
              <CardContent className="p-5">
                {scoreChartData.length > 0 ? (
                  <div aria-label="Grafik rata-rata nilai per mata pelajaran" role="img">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={scoreChartData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} accessibilityLayer>
                        <CartesianGrid vertical={false} stroke="#E8E8EC" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="mapel"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "#9C9C9C" }}
                          tickMargin={10}
                        />
                        <YAxis
                          domain={[0, 100]}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "#9C9C9C" }}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(99, 102, 241, 0.06)" }}
                          contentStyle={{
                            background: "#FFFFFF",
                            border: "1px solid #E8E8EC",
                            borderRadius: 8,
                            boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
                            fontSize: 12,
                          }}
                        />
                        <Bar
                          dataKey="nilai"
                          fill="#6B6B6B"
                          activeBar={{ fill: "#B45309" }}
                          radius={[6, 6, 0, 0]}
                          name="Rata-rata"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[280px] flex-col items-center justify-center text-center">
                    <BarChart3 className="mb-3 h-6 w-6 text-[#9C9C9C]" aria-hidden="true" />
                    <p className="text-sm font-medium text-[#6B6B6B] dark:text-[#A7A7AE]">Belum ada data nilai</p>
                    <p className="mt-1 text-xs text-[#9C9C9C]">Grafik akan muncul setelah nilai ujian tersedia.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-[#E8E8EC] bg-[#FFFFFF] py-0 shadow-none dark:border-white/10 dark:bg-[#19191C]">
              <CardHeader className="border-b border-[#E8E8EC] px-5 py-5 dark:border-white/10">
                <CardTitle className="genesis-heading flex items-center gap-2 text-base font-semibold text-[#0A0A0A] dark:text-[#F5F5F7]">
                  <BarChart3 className="h-4 w-4 text-[#6B6B6B] dark:text-[#A7A7AE]" aria-hidden="true" />
                  Ujian terbaru
                </CardTitle>
                <p className="text-xs text-[#9C9C9C]">Lima aktivitas terbaru</p>
              </CardHeader>
              <CardContent className="p-0">
                {recentExams.length === 0 ? (
                  <div className="flex min-h-[320px] flex-col items-center justify-center px-5 text-center">
                    <MonitorCheck className="mb-3 h-6 w-6 text-[#9C9C9C]" aria-hidden="true" />
                    <p className="text-sm font-medium text-[#6B6B6B] dark:text-[#A7A7AE]">Belum ada ujian</p>
                    <p className="mt-1 text-xs text-[#9C9C9C]">Aktivitas terbaru akan tampil di sini.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E8E8EC] dark:divide-white/10">
                    {recentExams.map((exam) => (
                      <div
                        key={exam.id}
                        className="flex items-start justify-between gap-4 px-5 py-4 transition-colors duration-200 hover:bg-[#FAFAFA] dark:hover:bg-white/[0.03]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#0A0A0A] dark:text-[#F5F5F7]" title={exam.title}>
                            {exam.title}
                          </p>
                          <p className="mt-1 truncate text-xs text-[#6B6B6B] dark:text-[#A7A7AE]">
                            {exam.subject.name} · {exam.teacher.user.name}
                          </p>
                          <p className="mt-1 text-[11px] text-[#9C9C9C]">
                            {numberFormat.format(exam._count.attempts)} peserta
                          </p>
                        </div>
                        <Badge
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium shadow-none hover:opacity-100 ${
                            statusStyle[exam.status] ?? statusStyle.CLOSED
                          }`}
                        >
                          {statusLabel[exam.status] ?? exam.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
