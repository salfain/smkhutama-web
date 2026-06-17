"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search, BookUser, ChevronRight } from "lucide-react";

type Row = { id: string; name: string; nis: string; className: string; violationPoints: number; achievementPoints: number; cases: number };

export function StudentsBookClient({ students }: { students: Row[] }) {
  const [q, setQ] = useState("");
  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(q.toLowerCase()) ||
    s.className.toLowerCase().includes(q.toLowerCase()) ||
    s.nis.includes(q)
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama / kelas / NIS..." className="pl-9" />
        </div>
        <button
          onClick={() => {
            if (filtered.length === 0) return;
            const headers = ["NIS", "Nama", "Kelas", "Poin Pelanggaran", "Poin Prestasi", "Sesi Konseling"];
            const csvContent = [
              headers.join(","),
              ...filtered.map(s => `"${s.nis}","${s.name}","${s.className}",${s.violationPoints},${s.achievementPoints},${s.cases}`)
            ].join("\n");
            
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Buku_Siswa_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <svg className="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <BookUser className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Tidak ada siswa.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
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
      )}
    </div>
  );
}
