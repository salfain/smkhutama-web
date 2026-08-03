import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, ArrowRight, CalendarDays, ClipboardCheck, Clock, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DashboardEmpty,
  DashboardHeader,
  DashboardPanel,
  DashboardPanelHeader,
  DashboardPill,
  DashboardSectionHeading,
  GenesisDashboard,
  dashboardLinkClass,
} from "@/components/dashboard/GenesisDashboard";
import { getExamTypeInfo } from "@/lib/exam-types";
import { requireAuth } from "@/lib/session";
import { getDashboard } from "@/server/modules/cbt/student";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard Siswa" };

export default async function StudentDashboard() {
  const cookieStore = await cookies();
  const system = cookieStore.get("student-system")?.value || "CBT";
  if (system === "SIBIKONS") redirect("/student/bk");

  const user = await requireAuth("STUDENT");
  if (!user.student) return null;

  const now = new Date();
  const { todayExams, upcomingExams, history } = await getDashboard(user.student);
  const today = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <GenesisDashboard className="max-w-6xl">
      <DashboardHeader
        eyebrow="Portal siswa"
        title="Dashboard Siswa"
        description={<>Selamat datang, {user.name}. Lihat jadwal ujian dan perkembangan hasil belajar Anda.</>}
        meta={
          <>
            <DashboardPill>{user.student.class?.name ?? "Kelas belum ditentukan"}</DashboardPill>
            {user.student.nis && <DashboardPill>NIS {user.student.nis}</DashboardPill>}
          </>
        }
        status={<DashboardPill>{today}</DashboardPill>}
      />

      <section className="mb-10" aria-labelledby="today-exams">
        <DashboardSectionHeading title="Ujian hari ini" description="Ujian yang tersedia sesuai jadwal kelas Anda." action={todayExams.length > 0 ? <DashboardPill tone="success">{todayExams.length} tersedia</DashboardPill> : undefined} />
        <div id="today-exams">
          {todayExams.length === 0 ? (
            <DashboardPanel className="border-dashed">
              <DashboardEmpty icon={CalendarDays} title="Tidak ada ujian hari ini" description="Gunakan waktu ini untuk mempersiapkan jadwal berikutnya." />
            </DashboardPanel>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {todayExams.map((exam) => {
                const typeInfo = getExamTypeInfo(exam.examType);
                return (
                  <Link key={exam.id} href={`/student/exams/${exam.id}/token`} className="group rounded-xl border border-[#E8E8EC] bg-[#FFFFFF] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/15 dark:border-white/10 dark:bg-[#19191C] dark:hover:border-brand dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.28)]">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <Badge className={`rounded-full px-2.5 py-1 text-[11px] font-medium shadow-none hover:opacity-100 ${typeInfo.color}`}>{typeInfo.short}</Badge>
                      <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Tersedia</span>
                    </div>
                    <h3 className="genesis-heading text-xl font-semibold text-[#0A0A0A] transition-colors group-hover:text-brand-text dark:text-[#F5F5F7] dark:group-hover:text-brand-text">{exam.title}</h3>
                    <p className="mt-1 text-sm text-[#6B6B6B] dark:text-[#A7A7AE]">{exam.subject.name}</p>
                    <div className="mt-5 grid gap-3 border-t border-[#E8E8EC] pt-4 text-xs text-[#6B6B6B] dark:border-white/10 dark:text-[#A7A7AE] sm:grid-cols-2">
                      <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-[#9C9C9C]" /> {formatTime(exam.startAt)}–{formatTime(exam.endAt)}</span>
                      <span className="flex items-center gap-2"><ClipboardCheck className="h-3.5 w-3.5 text-[#9C9C9C]" /> {exam._count.questions} soal · {exam.durationMinutes} menit</span>
                    </div>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-text group-hover:text-brand-text">Masuk ujian <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="student-schedule">
        <DashboardSectionHeading title="Jadwal & hasil" description="Agenda mendatang dan riwayat ujian terbaru." />
        <div id="student-schedule" className="grid gap-5 lg:grid-cols-2">
          <DashboardPanel>
            <DashboardPanelHeader icon={AlertCircle} title="Jadwal mendatang" description="Ujian berikutnya yang perlu dipersiapkan" />
            {upcomingExams.length === 0 ? (
              <DashboardEmpty icon={CalendarDays} title="Tidak ada jadwal mendatang" />
            ) : (
              <div className="divide-y divide-[#E8E8EC] dark:divide-white/10">
                {upcomingExams.map((exam) => {
                  const typeInfo = getExamTypeInfo(exam.examType);
                  return (
                    <div key={exam.id} className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#FAFAFA] dark:hover:bg-white/[0.03]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-[#0A0A0A] dark:text-[#F5F5F7]">{exam.title}</p>
                          <Badge className={`rounded-full px-2 py-0.5 text-[10px] shadow-none hover:opacity-100 ${typeInfo.color}`}>{typeInfo.short}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-[#6B6B6B] dark:text-[#A7A7AE]">{formatDate(exam.startAt)} · {formatTime(exam.startAt)} · {exam.durationMinutes} menit</p>
                      </div>
                      <span className="shrink-0 rounded bg-[#F5F5F7] px-2 py-1 text-[11px] font-medium text-[#6B6B6B] dark:bg-white/5 dark:text-[#A7A7AE]">{exam.subject.code}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel>
            <DashboardPanelHeader
              icon={Trophy}
              title="Riwayat ujian"
              description="Hasil terbaru yang telah diproses"
              action={<Link href="/student/results" className={dashboardLinkClass}>Lihat semua</Link>}
            />
            {history.length === 0 ? (
              <DashboardEmpty icon={Trophy} title="Belum ada ujian yang dikerjakan" />
            ) : (
              <div className="divide-y divide-[#E8E8EC] dark:divide-white/10">
                {history.map((attempt) => {
                  const passed = attempt.exam.passingScore !== null && (attempt.score ?? 0) >= attempt.exam.passingScore;
                  return (
                    <div key={attempt.id} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#FAFAFA] dark:hover:bg-white/[0.03]">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#0A0A0A] dark:text-[#F5F5F7]">{attempt.exam.title}</p>
                        <p className="mt-1 text-xs text-[#6B6B6B] dark:text-[#A7A7AE]">{attempt.exam.subject.code}{attempt.submittedAt ? ` · ${formatDate(attempt.submittedAt)}` : ""}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`genesis-heading text-xl font-semibold ${attempt.score === null ? "text-[#9C9C9C]" : passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{attempt.score ?? "—"}</p>
                        {attempt.exam.passingScore !== null && <p className="text-[11px] text-[#9C9C9C]">KKM {attempt.exam.passingScore}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DashboardPanel>
        </div>
      </section>
    </GenesisDashboard>
  );
}

function formatTime(value: Date) {
  return new Date(value).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(value: Date) {
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}
