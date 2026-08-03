import { AlertCircle, Clock, LogOut, UserX } from "lucide-react";
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
import { requirePiketAuth } from "@/lib/session";
import { getDashboardSummary } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard Piket – SMK Hutama" };

export default async function PiketDashboardPage() {
  const user = await requirePiketAuth();
  const { tardiness, permits, absences, activePermits } = await getDashboardSummary();
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <GenesisDashboard>
      <DashboardHeader
        eyebrow="Ketertiban harian"
        title="Dashboard Guru Piket"
        description={<>Selamat bertugas, {user.name}. Pantau kejadian dan perizinan siswa hari ini.</>}
        meta={<DashboardPill>{today}</DashboardPill>}
      />

      <section className="mb-10" aria-labelledby="piket-summary">
        <DashboardSectionHeading title="Ringkasan hari ini" description="Data kedisiplinan dan kehadiran yang tercatat." />
        <div id="piket-summary" className="grid gap-4 sm:grid-cols-3 lg:gap-5">
          <DashboardMetric icon={Clock} label="Siswa Terlambat" value={tardiness} detail="Catatan hari ini" tone="warning" href="/piket/terlambat" />
          <DashboardMetric icon={LogOut} label="Izin Aktif" value={permits} detail="Belum kembali" tone="danger" href="/piket/izin" />
          <DashboardMetric icon={UserX} label="Guru Tidak Hadir" value={absences} detail="Catatan hari ini" href="/piket/guru" />
        </div>
      </section>

      <section aria-labelledby="active-permits">
        <DashboardSectionHeading title="Perizinan aktif" description="Siswa yang tercatat keluar dan belum kembali." />
        <DashboardPanel>
          <DashboardPanelHeader
            icon={AlertCircle}
            title="Siswa belum kembali"
            description="Perlu dipantau hingga siswa melakukan check-in"
            action={permits > 0 ? <DashboardPill tone="danger">{permits} aktif</DashboardPill> : undefined}
          />
          <div id="active-permits">
            {activePermits.length === 0 ? (
              <DashboardEmpty icon={LogOut} title="Tidak ada siswa yang sedang izin keluar" description="Semua siswa telah kembali atau belum ada perizinan hari ini." />
            ) : (
              <div className="divide-y divide-[#E8E8EC] dark:divide-white/10">
                {activePermits.map((permit) => (
                  <div key={permit.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#FAFAFA] dark:hover:bg-white/[0.03]">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-sm font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-400">
                      {permit.student.user.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#0A0A0A] dark:text-[#F5F5F7]">{permit.student.user.name}</p>
                      <p className="mt-1 truncate text-xs text-[#6B6B6B] dark:text-[#A7A7AE]">
                        {permit.student.class?.name ?? "—"} · {permit.reason}
                      </p>
                    </div>
                    <time className="shrink-0 font-mono text-xs text-[#9C9C9C]">
                      {permit.exitTime ? new Date(permit.exitTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </time>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DashboardPanel>
      </section>
    </GenesisDashboard>
  );
}
