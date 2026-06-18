import { requirePiketAuth } from "@/lib/session";
import { getDashboardSummary } from "../actions";
import { Clock, LogOut, UserX, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard Piket – SMK Hutama" };

export default async function PiketDashboardPage() {
  await requirePiketAuth();
  const { tardiness, permits, absences, activePermits } = await getDashboardSummary();

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Dashboard Piket</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{today}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <SummaryCard
          icon={Clock}
          label="Siswa Terlambat"
          value={tardiness}
          color="amber"
          href="/piket/terlambat"
        />
        <SummaryCard
          icon={LogOut}
          label="Izin Aktif (Belum Kembali)"
          value={permits}
          color="red"
          href="/piket/izin"
        />
        <SummaryCard
          icon={UserX}
          label="Guru Tidak Hadir"
          value={absences}
          color="blue"
          href="/piket/guru"
        />
      </div>

      {/* Izin aktif */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm">
        <div className="border-b dark:border-slate-800 px-5 py-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Siswa Belum Kembali</h2>
          {permits > 0 && (
            <span className="ml-auto inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {permits} aktif
            </span>
          )}
        </div>
        {activePermits.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
            Tidak ada siswa yang sedang izin keluar.
          </div>
        ) : (
          <div className="divide-y dark:divide-slate-800">
            {activePermits.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 font-bold text-sm dark:bg-red-900/20 dark:text-red-400">
                  {p.student.user.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{p.student.user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{p.student.class?.name ?? "—"} · {p.reason}</p>
                </div>
                <div className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                  {p.exitTime ? new Date(p.exitTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color, href }: {
  icon: typeof Clock; label: string; value: number; color: "amber" | "red" | "blue"; href: string;
}) {
  const colors = {
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    red:   "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    blue:  "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  };
  return (
    <a href={href} className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow block">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </a>
  );
}
