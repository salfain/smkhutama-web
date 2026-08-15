import Link from "next/link";
import { Award, FolderOpen, Inbox, MessagesSquare, ShieldAlert, TriangleAlert, Users } from "lucide-react";
import {
  DashboardEmpty,
  DashboardHeader,
  DashboardMetric,
  DashboardPanel,
  DashboardPanelHeader,
  DashboardSectionHeading,
  GenesisDashboard,
  dashboardLinkClass,
} from "@/components/dashboard/GenesisDashboard";
import { getDashboardStats } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard BK" };

const typeLabel: Record<string, string> = { PRIBADI: "Pribadi", SOSIAL: "Sosial", BELAJAR: "Belajar", KARIR: "Karir" };
const statusLabel: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "Terbuka", cls: "border-brand-soft bg-brand-soft text-brand-text dark:border-brand/20 dark:bg-brand/10 dark:text-brand-text" },
  IN_PROGRESS: { label: "Proses", cls: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400" },
  RESOLVED: { label: "Selesai", cls: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400" },
  REFERRED: { label: "Rujukan", cls: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400" },
};

export default async function CounselorDashboard() {
  const stats = await getDashboardStats().catch(() => null);

  if (!stats) {
    return (
      <GenesisDashboard>
        <DashboardHeader eyebrow="Bimbingan konseling" title="Dashboard BK" description="Ringkasan layanan dan pendampingan siswa." />
        <DashboardPanel>
          <DashboardEmpty icon={MessagesSquare} title="Data belum dapat dimuat" description="Periksa koneksi database lalu muat ulang halaman." />
        </DashboardPanel>
      </GenesisDashboard>
    );
  }

  const cards = [
    { label: "Kasus Aktif", value: stats.openCases, icon: FolderOpen, tone: "warning" as const },
    { label: "Permohonan Baru", value: stats.pendingRequests, icon: Inbox, tone: "neutral" as const },
    { label: "Pelanggaran", value: stats.totalViolations, icon: ShieldAlert, tone: "danger" as const },
    { label: "Prestasi", value: stats.totalAchievements, icon: Award, tone: "success" as const },
  ];

  return (
    <GenesisDashboard>
      <div className="mb-10 rounded-[24px] bg-gradient-to-br from-[#6D28D9] to-[#9333EA] p-[22px] text-white shadow-[0_16px_40px_-20px_rgba(109,40,217,0.55)]">
        <p className="text-[13px] text-white/75">Selamat datang,</p>
        <h1 className="genesis-heading mt-1 text-[23px] font-extrabold leading-tight">Guru BK</h1>
        <p className="mt-1 text-[12.5px] text-white/80">Pantau kegiatan konseling, permohonan layanan, pelanggaran, dan prestasi siswa.</p>
      </div>

      <section className="mb-10" aria-labelledby="bk-summary">
        <DashboardSectionHeading title="Ringkasan layanan" description="Indikator utama pendampingan siswa." />
        <div id="bk-summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
          {cards.map((card) => <DashboardMetric key={card.label} {...card} />)}
        </div>
      </section>

      <section aria-labelledby="bk-activity">
        <DashboardSectionHeading title="Aktivitas terkini" description="Kasus terbaru dan siswa yang memerlukan perhatian." />
        <div id="bk-activity" className="grid gap-5 xl:grid-cols-3">
          <DashboardPanel>
            <DashboardPanelHeader
              icon={TriangleAlert}
              title="Prioritas penanganan"
              description="Risiko tinggi atau tindak lanjut terdekat"
              action={<Link href="/counselor/cases" className={dashboardLinkClass}>Lihat kasus</Link>}
            />
            {stats.priorityCases.length === 0 ? (
              <DashboardEmpty icon={TriangleAlert} title="Tidak ada kasus mendesak" />
            ) : (
              <div className="divide-y divide-[#E8E8EC] dark:divide-white/10">
                {stats.priorityCases.slice(0, 5).map((item) => (
                  <Link key={item.id} href={`/counselor/cases/${item.id}`} className="flex items-start justify-between gap-3 px-5 py-4 transition-colors hover:bg-[#FAFAFA] dark:hover:bg-white/[0.03]">
                    <div className="min-w-0"><p className="truncate text-sm font-medium text-[#0A0A0A] dark:text-[#F5F5F7]">{item.title}</p><p className="mt-1 text-xs text-[#9C9C9C]">{item.studentName} · {item.className}</p></div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${item.riskLevel === "CRITICAL" || item.priority === "CRITICAL" ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"}`}>{item.riskLevel !== "NONE" ? `Risiko ${item.riskLevel}` : item.priority}</span>
                  </Link>
                ))}
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel>
            <DashboardPanelHeader
              icon={MessagesSquare}
              title="Konseling terbaru"
              description="Sesi yang baru dibuat atau diperbarui"
              action={<Link href="/counselor/cases" className={dashboardLinkClass}>Lihat semua</Link>}
            />
            {stats.recentCases.length === 0 ? (
              <DashboardEmpty icon={MessagesSquare} title="Belum ada sesi konseling" />
            ) : (
              <div className="divide-y divide-[#E8E8EC] dark:divide-white/10">
                {stats.recentCases.map((item) => {
                  const status = statusLabel[item.status] ?? statusLabel.OPEN;
                  return (
                    <div key={item.id} className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#FAFAFA] dark:hover:bg-white/[0.03]">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#0A0A0A] dark:text-[#F5F5F7]">{item.title}</p>
                        <p className="mt-1 text-xs text-[#6B6B6B] dark:text-[#A7A7AE]">
                          {item.studentName} · {item.className} · {typeLabel[item.type] ?? item.type}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${status.cls}`}>{status.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel>
            <DashboardPanelHeader
              icon={Users}
              title="Poin pelanggaran tertinggi"
              description="Prioritas tindak lanjut siswa"
              action={<Link href="/counselor/violations" className={dashboardLinkClass}>Lihat semua</Link>}
            />
            {stats.topStudents.length === 0 ? (
              <DashboardEmpty icon={ShieldAlert} title="Belum ada data pelanggaran" />
            ) : (
              <div className="divide-y divide-[#E8E8EC] dark:divide-white/10">
                {stats.topStudents.map((student, index) => (
                  <div key={`${student.name}-${index}`} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#FAFAFA] dark:hover:bg-white/[0.03]">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F5F7] text-xs font-semibold text-[#6B6B6B] dark:bg-white/5 dark:text-[#A7A7AE]">{index + 1}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#0A0A0A] dark:text-[#F5F5F7]">{student.name}</p>
                        <p className="mt-1 text-xs text-[#9C9C9C]">{student.className}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">{student.points} poin</span>
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
