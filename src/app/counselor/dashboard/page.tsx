import { getDashboardStats } from "../actions";
import { ShieldAlert, Award, FolderOpen, Inbox } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const typeLabel: Record<string, string> = { PRIBADI: "Pribadi", SOSIAL: "Sosial", BELAJAR: "Belajar", KARIR: "Karir" };
const statusLabel: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "Terbuka", cls: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "Proses", cls: "bg-sky-100 text-sky-700" },
  RESOLVED: { label: "Selesai", cls: "bg-green-100 text-green-700" },
  REFERRED: { label: "Rujukan", cls: "bg-purple-100 text-purple-700" },
};

export default async function CounselorDashboard() {
  const stats = await getDashboardStats().catch(() => null);
  if (!stats) {
    return <div className="p-8 text-sm text-gray-500">Gagal memuat data. Periksa koneksi database.</div>;
  }

  const cards = [
    { label: "Kasus Aktif", value: stats.openCases, icon: FolderOpen, color: "bg-blue-500" },
    { label: "Permohonan Baru", value: stats.pendingRequests, icon: Inbox, color: "bg-pink-500" },
    { label: "Pelanggaran", value: stats.totalViolations, icon: ShieldAlert, color: "bg-red-500" },
    { label: "Prestasi", value: stats.totalAchievements, icon: Award, color: "bg-emerald-500" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Dashboard Bimbingan Konseling</h1>
        <p className="text-sm text-gray-500">Ringkasan kegiatan konseling, pelanggaran, dan prestasi siswa.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${c.color}`}>
              <c.icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Konseling terbaru */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Konseling Terbaru</h2>
            <Link href="/counselor/cases" className="text-xs font-medium text-purple-600 hover:underline">Lihat semua</Link>
          </div>
          {stats.recentCases.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada sesi konseling.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentCases.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{c.title}</p>
                    <p className="text-xs text-gray-500">{c.studentName} · {c.className} · {typeLabel[c.type]}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusLabel[c.status].cls}`}>
                    {statusLabel[c.status].label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top poin pelanggaran */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Siswa Poin Pelanggaran Tertinggi</h2>
            <Link href="/counselor/violations" className="text-xs font-medium text-purple-600 hover:underline">Lihat semua</Link>
          </div>
          {stats.topStudents.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada data pelanggaran.</p>
          ) : (
            <div className="space-y-3">
              {stats.topStudents.map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-xs font-bold text-red-600">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.className}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">{s.points} poin</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
