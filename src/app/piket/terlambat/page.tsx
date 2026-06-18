import { requirePiketAuth } from "@/lib/session";
import { getTardinessData } from "../actions";
import { TardinessClient } from "./TardinessClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Keterlambatan Siswa – Piket" };

export default async function TerlambatPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requirePiketAuth();
  const sp = await searchParams;
  const { records, students } = await getTardinessData(sp.date);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Keterlambatan Siswa</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Catat siswa yang datang terlambat hari ini.</p>
      </div>
      <TardinessClient records={records.map((r) => ({
        id: r.id,
        studentName: r.student.user.name,
        className: r.student.class?.name ?? "—",
        arrivalTime: r.arrivalTime,
        reason: r.reason,
        sanction: r.sanction,
        createdAt: r.createdAt,
      }))} students={students.map((s) => ({
        id: s.id,
        name: s.user.name,
        className: s.class?.name ?? "—",
        nis: s.nis,
      }))} />
    </div>
  );
}
