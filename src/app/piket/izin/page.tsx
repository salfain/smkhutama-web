import { requirePiketAuth } from "@/lib/session";
import { getPermitData } from "../actions";
import { PermitClient } from "./PermitClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Izin Keluar/Masuk – Piket" };

export default async function IzinPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requirePiketAuth();
  const sp = await searchParams;
  const { records, students } = await getPermitData(sp.date);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Izin Keluar / Masuk</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Catat siswa yang keluar saat jam pelajaran dan tandai saat kembali.</p>
      </div>
      <PermitClient
        records={records.map((r) => ({
          id: r.id,
          studentName: r.student.user.name,
          className: r.student.class?.name ?? "—",
          reason: r.reason,
          exitTime: r.exitTime,
          returnTime: r.returnTime,
          status: r.status,
        }))}
        students={students.map((s) => ({
          id: s.id,
          name: s.user.name,
          className: s.class?.name ?? "—",
          nis: s.nis,
        }))}
      />
    </div>
  );
}
