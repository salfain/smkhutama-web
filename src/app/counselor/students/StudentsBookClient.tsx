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
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama / kelas / NIS..." className="pl-9" />
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
