"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search, BookUser, ChevronRight, Download } from "lucide-react";
import { exportStudentsBook } from "../bk-actions";

type ProfileStatus = "DRAFT" | "PENDING" | "VERIFIED" | "REJECTED";
type Row = { id: string; name: string; nis: string; className: string; violationPoints: number; achievementPoints: number; cases: number; profileStatus: ProfileStatus };

/** Status biodata; hanya ditandai bila belum beres agar daftar tetap tenang. */
const profileBadge: Partial<Record<ProfileStatus, { label: string; cls: string }>> = {
  DRAFT: { label: "Biodata kosong", cls: "bg-gray-100 text-gray-600" },
  PENDING: { label: "Perlu verifikasi", cls: "bg-amber-100 text-amber-700" },
  REJECTED: { label: "Dikembalikan", cls: "bg-red-100 text-red-700" },
};

const FILTERS = [
  { key: "ALL", label: "Semua" },
  { key: "PENDING", label: "Perlu verifikasi" },
  { key: "DRAFT", label: "Biodata kosong" },
  { key: "REJECTED", label: "Dikembalikan" },
  { key: "VERIFIED", label: "Terverifikasi" },
] as const;

const BOM = "﻿"; // supaya Excel membaca huruf beraksen dengan benar
const NEWLINE = "\r\n";

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function StudentsBookClient({ students }: { students: Row[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("ALL");
  const [exporting, startExport] = useTransition();
  const [exportError, setExportError] = useState("");

  const counts = students.reduce<Record<string, number>>((acc, s) => {
    acc[s.profileStatus] = (acc[s.profileStatus] ?? 0) + 1;
    return acc;
  }, {});

  const filtered = students.filter((s) => {
    const cocok =
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.className.toLowerCase().includes(q.toLowerCase()) ||
      s.nis.includes(q);
    return cocok && (filter === "ALL" || s.profileStatus === filter);
  });

  /** Biodata hanya diambil saat ekspor, lewat action berizin `bk.sensitive.export`. */
  function unduhCsv() {
    setExportError("");
    startExport(async () => {
      try {
        const rows = await exportStudentsBook();
        const headers = [
          "NIS", "NISN", "Nama", "Kelas", "Tempat Lahir", "Tanggal Lahir", "Alamat",
          "Nomor Orang Tua", "Status Biodata", "Poin Pelanggaran", "Poin Prestasi", "Sesi Konseling",
        ];
        const isi = rows.map((r) => [
          r.nis, r.nisn, r.name, r.className, r.birthPlace, r.birthDate, r.address,
          r.parentPhone, r.profileStatus, r.violationPoints, r.achievementPoints, r.cases,
        ].map(csvCell).join(","));
        const blob = new Blob([BOM, [headers.join(","), ...isi].join(NEWLINE)], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Buku_Siswa_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {
        setExportError("Gagal mengekspor. Pastikan Anda punya izin ekspor data BK.");
      }
    });
  }

  return (
    <div>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama / kelas / NIS..." className="pl-9" />
        </div>
        <button
          onClick={unduhCsv}
          disabled={exporting || students.length === 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <Download className="h-4 w-4 text-gray-500" />
          {exporting ? "Menyiapkan..." : "Export CSV"}
        </button>
      </div>

      {/* Antrean verifikasi biodata gampang tenggelam di daftar panjang. */}
      <div className="mb-4 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => {
          const jumlah = f.key === "ALL" ? students.length : counts[f.key] ?? 0;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.key
                  ? "border-purple-600 bg-purple-600 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label} ({jumlah})
            </button>
          );
        })}
      </div>

      {exportError && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{exportError}</p>}

      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <BookUser className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Tidak ada siswa pada filter ini.</p>
        </div>
      ) : (
        <>
          {/* Mobile: kartu per siswa */}
          <ul className="space-y-2 md:hidden">
            {filtered.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/counselor/students/${s.id}`}
                  className="flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm active:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">{s.name}</p>
                    <p className="truncate text-xs text-gray-400">{s.className}{s.nis && ` · ${s.nis}`}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                        {s.violationPoints} pelanggaran
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                        {s.achievementPoints} prestasi
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
                        {s.cases} konseling
                      </span>
                      {profileBadge[s.profileStatus] && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${profileBadge[s.profileStatus]!.cls}`}>
                          {profileBadge[s.profileStatus]!.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>

          {/* Tablet & desktop: tabel penuh */}
          <div className="hidden overflow-x-auto rounded-xl border bg-white shadow-sm md:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3">Siswa</th>
                  <th className="px-4 py-3 text-center">Pelanggaran</th>
                  <th className="px-4 py-3 text-center">Prestasi</th>
                  <th className="px-4 py-3 text-center">Konseling</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.className}{s.nis && ` · ${s.nis}`}</p>
                      {profileBadge[s.profileStatus] && (
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${profileBadge[s.profileStatus]!.cls}`}>
                          {profileBadge[s.profileStatus]!.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center"><span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{s.violationPoints}</span></td>
                    <td className="px-4 py-3 text-center"><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">{s.achievementPoints}</span></td>
                    <td className="px-4 py-3 text-center text-gray-600">{s.cases}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/counselor/students/${s.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:underline">
                        Detail <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
