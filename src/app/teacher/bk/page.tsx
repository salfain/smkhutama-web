import { getHomeroomBk } from "./actions";
import { HeartHandshake } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherBkPage() {
  const classes = await getHomeroomBk();

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">BK Kelas Perwalian</h1>
        <p className="text-sm text-gray-500">Data bimbingan konseling siswa di kelas yang Anda wali (hanya lihat).</p>
      </div>

      {!classes || classes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <HeartHandshake className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Anda belum ditetapkan sebagai wali kelas. Hubungi admin.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {classes.map((c) => (
            <div key={c.id}>
              <h2 className="mb-2 text-sm font-semibold text-gray-800">{c.name} · {c.students.length} siswa</h2>
              <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Siswa</th>
                      <th className="px-4 py-3 text-center">Poin Pelanggaran</th>
                      <th className="px-4 py-3 text-center">Poin Prestasi</th>
                      <th className="px-4 py-3 text-center">Konseling</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {c.students.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><p className="font-medium text-gray-900">{s.name}</p>{s.nis && <p className="text-xs text-gray-400">{s.nis}</p>}</td>
                        <td className="px-4 py-3 text-center"><span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{s.violationPoints}</span></td>
                        <td className="px-4 py-3 text-center"><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">{s.achievementPoints}</span></td>
                        <td className="px-4 py-3 text-center text-gray-600">{s.cases}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
