"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, MessagesSquare, ShieldAlert, Award, Home as HomeIcon } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { exportReportExcel } from "../reports-actions";

type Data = {
  totalCases: number; totalViolations: number; totalAchievements: number; totalRequests: number; totalHomeVisits: number;
  perClass: { className: string; students: number; violations: number; violationPoints: number; achievementPoints: number; cases: number }[];
  months: { label: string; count: number }[];
  typeData: { type: string; count: number }[];
};

const typeLabel: Record<string, string> = { PRIBADI: "Pribadi", SOSIAL: "Sosial", BELAJAR: "Belajar", KARIR: "Karir" };
const PIE_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"];

export function ReportsClient({ data }: { data: Data }) {
  const [pending, startTransition] = useTransition();

  function exportExcel() {
    startTransition(async () => {
      const r = await exportReportExcel();
      const blob = new Blob([new Uint8Array(r.data)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = r.filename; a.click();
      URL.revokeObjectURL(url);
    });
  }

  const cards = [
    { label: "Total Konseling", value: data.totalCases, icon: MessagesSquare, color: "bg-purple-500" },
    { label: "Total Pelanggaran", value: data.totalViolations, icon: ShieldAlert, color: "bg-red-500" },
    { label: "Total Prestasi", value: data.totalAchievements, icon: Award, color: "bg-emerald-500" },
    { label: "Kunjungan Rumah", value: data.totalHomeVisits, icon: HomeIcon, color: "bg-blue-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={exportExcel} disabled={pending}>
          <FileSpreadsheet className="h-4 w-4" />{pending ? "Menyiapkan..." : "Export Excel"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${c.color}`}><c.icon className="h-5 w-5 text-white" /></div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tren pelanggaran */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Tren Pelanggaran (6 Bulan)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.months}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} name="Pelanggaran" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Konseling per jenis */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Konseling per Jenis</h2>
          {data.typeData.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data.typeData.map((t) => ({ name: typeLabel[t.type] ?? t.type, value: t.count }))}
                  dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {data.typeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Rekap per kelas */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-900">Poin Pelanggaran per Kelas</h2>
        {data.perClass.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada data kelas.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.perClass}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="className" fontSize={11} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="violationPoints" fill="#ef4444" name="Poin Pelanggaran" radius={[4, 4, 0, 0]} />
              <Bar dataKey="achievementPoints" fill="#10b981" name="Poin Prestasi" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
