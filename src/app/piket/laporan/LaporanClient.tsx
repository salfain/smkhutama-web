"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download, AlarmClock, LogOut, Users, AlertTriangle,
  TrendingUp, FileSpreadsheet,
} from "lucide-react";
import { exportLaporanPiket } from "./actions";
import { PiketDateFilter } from "@/components/piket/PiketDateFilter";

type Summary = { totalTardiness: number; totalPermits: number; totalAbsences: number; notReturned: number };
type TardinessRow = { id: string; studentName: string; className: string; arrivalTime: Date | null; reason: string; sanction: string };
type PermitRow = { id: string; studentName: string; className: string; reason: string; exitTime: Date | null; returnTime: Date | null; status: string };
type AttendanceRow = { id: string; teacherName: string; className: string; status: string; period: string; substitute: string };
type TrendDay = { date: string; tardiness: number; permits: number; absences: number };

const statusStyle: Record<string, { label: string; className: string }> = {
  KELUAR:        { label: "Belum Kembali", className: "bg-red-100 text-red-700 border-red-200" },
  SUDAH_KEMBALI: { label: "Sudah Kembali", className: "bg-green-100 text-green-700 border-green-200" },
  TIDAK_KEMBALI: { label: "Tidak Kembali", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

const attendanceStyle: Record<string, { label: string; className: string }> = {
  HADIR:       { label: "Hadir",        className: "bg-green-100 text-green-700 border-green-200" },
  TIDAK_HADIR: { label: "Tidak Hadir",  className: "bg-red-100 text-red-700 border-red-200" },
  DIGANTIKAN:  { label: "Digantikan",   className: "bg-amber-100 text-amber-700 border-amber-200" },
  TUGAS_LUAR:  { label: "Tugas Luar",   className: "bg-blue-100 text-blue-700 border-blue-200" },
};

function fmtTime(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function TrendBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 text-right font-mono font-semibold">{value}</span>
    </div>
  );
}

interface Props {
  summary: Summary;
  tardiness: TardinessRow[];
  permits: PermitRow[];
  teacherAttendances: AttendanceRow[];
  trend: TrendDay[];
  dateLabel: string;
  currentDate?: string;
}

export function LaporanClient({ summary, tardiness, permits, teacherAttendances, trend, dateLabel, currentDate }: Props) {
  const [tab, setTab] = useState<"tardiness" | "permits" | "attendance">("tardiness");
  const [pending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const r = await exportLaporanPiket(currentDate);
      const blob = new Blob([new Uint8Array(r.data)], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = r.filename; a.click();
      URL.revokeObjectURL(url);
    });
  }

  const trendMax = Math.max(...trend.map(d => Math.max(d.tardiness, d.permits, d.absences)), 1);

  const summaryCards = [
    { label: "Terlambat",   value: summary.totalTardiness, icon: AlarmClock,      color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
    { label: "Izin Keluar", value: summary.totalPermits,   icon: LogOut,          color: "text-red-600 dark:text-red-400",    bg: "bg-red-50 dark:bg-red-900/20" },
    { label: "Guru Absen",  value: summary.totalAbsences,  icon: Users,           color: "text-blue-600 dark:text-blue-400",  bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Blm Kembali", value: summary.notReturned,    icon: AlertTriangle,   color: "text-rose-600 dark:text-rose-400",  bg: "bg-rose-50 dark:bg-rose-900/20" },
  ];

  return (
    <div className="space-y-6">
      {/* Header: filter tanggal + tombol export */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PiketDateFilter currentDate={currentDate} />
        <Button
          size="sm"
          onClick={handleExport}
          disabled={pending}
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
        >
          <FileSpreadsheet className="h-4 w-4" />
          {pending ? "Mengunduh..." : "Export Excel (3 Sheet)"}
        </Button>
      </div>

      {/* Tanggal */}
      <p className="text-sm text-gray-500 dark:text-gray-400">{dateLabel}</p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryCards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 p-4 shadow-sm">
            <div className={`mb-2 inline-flex rounded-lg p-2 ${c.bg}`}>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{c.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Trend 7 hari */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Trend 7 Hari Terakhir</h3>
        </div>
        <div className="space-y-2.5">
          {trend.map(d => (
            <div key={d.date} className="grid grid-cols-[56px_1fr] gap-x-3 gap-y-0.5 items-start">
              <span className="text-xs text-gray-400 dark:text-gray-500 pt-0.5">{d.date}</span>
              <div className="space-y-0.5">
                <TrendBar value={d.tardiness} max={trendMax} color="bg-orange-400" />
                <TrendBar value={d.permits}   max={trendMax} color="bg-red-400" />
                <TrendBar value={d.absences}  max={trendMax} color="bg-blue-400" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-orange-400" /> Terlambat</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-400" /> Izin</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-blue-400" /> Guru Absen</span>
        </div>
      </div>

      {/* Tab detail */}
      <div>
        <div className="mb-4 flex gap-2 flex-wrap">
          {([
            { key: "tardiness",  label: `Terlambat (${tardiness.length})`,         icon: AlarmClock },
            { key: "permits",    label: `Izin Keluar (${permits.length})`,           icon: LogOut },
            { key: "attendance", label: `Kehadiran Guru (${teacherAttendances.length})`, icon: Users },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 border dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Terlambat */}
        {tab === "tardiness" && (
          tardiness.length === 0
            ? <EmptyState label="Tidak ada catatan keterlambatan." />
            : <div className="overflow-hidden rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-950 text-xs text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3 text-left">Siswa</th>
                      <th className="px-4 py-3 text-left">Kelas</th>
                      <th className="px-4 py-3 text-left">Tiba</th>
                      <th className="px-4 py-3 text-left hidden sm:table-cell">Alasan</th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">Sanksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    {tardiness.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.studentName}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{r.className}</td>
                        <td className="px-4 py-3 font-mono text-xs text-orange-600 dark:text-orange-400 font-semibold">{fmtTime(r.arrivalTime)}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{r.reason}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">{r.sanction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        )}

        {/* Izin */}
        {tab === "permits" && (
          permits.length === 0
            ? <EmptyState label="Tidak ada catatan izin keluar." />
            : <div className="overflow-hidden rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-950 text-xs text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3 text-left">Siswa</th>
                      <th className="px-4 py-3 text-left hidden sm:table-cell">Alasan</th>
                      <th className="px-4 py-3 text-left">Keluar</th>
                      <th className="px-4 py-3 text-left hidden sm:table-cell">Kembali</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    {permits.map(r => {
                      const s = statusStyle[r.status] ?? { label: r.status, className: "" };
                      return (
                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 dark:text-white">{r.studentName}</p>
                            <p className="text-xs text-gray-400">{r.className}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{r.reason}</td>
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-red-600 dark:text-red-400">{fmtTime(r.exitTime)}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400 hidden sm:table-cell">{fmtTime(r.returnTime)}</td>
                          <td className="px-4 py-3">
                            <Badge className={`text-xs hover:opacity-100 ${s.className}`}>{s.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
        )}

        {/* Kehadiran Guru */}
        {tab === "attendance" && (
          teacherAttendances.length === 0
            ? <EmptyState label="Tidak ada catatan kehadiran guru." />
            : <div className="overflow-hidden rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-950 text-xs text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3 text-left">Guru</th>
                      <th className="px-4 py-3 text-left">Kelas</th>
                      <th className="px-4 py-3 text-left hidden sm:table-cell">Jam</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">Pengganti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    {teacherAttendances.map(r => {
                      const s = attendanceStyle[r.status] ?? { label: r.status, className: "" };
                      return (
                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.teacherName}</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{r.className}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{r.period}</td>
                          <td className="px-4 py-3">
                            <Badge className={`text-xs hover:opacity-100 ${s.className}`}>{s.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{r.substitute}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
        )}
      </div>

      {/* Download button bottom */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport} disabled={pending} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          {pending ? "Mengunduh..." : "Download Laporan Excel"}
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
      <p className="text-sm text-gray-400 dark:text-gray-500">{label}</p>
    </div>
  );
}
