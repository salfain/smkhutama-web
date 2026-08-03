import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { dayRange, isDateOnly, todayDateOnly } from "@/server/date-range";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type SearchParams = { date?: string; classId?: string };

function timeLabel(value: Date) {
  return value.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default async function AdminTardinessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAuth("KESISWAAN");
  const params = await searchParams;
  const date = isDateOnly(params.date) ? params.date : todayDateOnly();
  const classId = params.classId?.trim() || "ALL";
  const { start, end } = dayRange(date);

  const [records, classes] = await Promise.all([
    prisma.studentTardiness.findMany({
      where: {
        date: { gte: start, lte: end },
        ...(classId !== "ALL" ? { student: { is: { classId } } } : {}),
      },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
      orderBy: { arrivalTime: "desc" },
    }),
    prisma.class.findMany({
      select: { id: true, name: true },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Rekap Keterlambatan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Data guru piket, ditampilkan baca saja.</p>
        </div>
        <Button asChild size="sm"><Link href="/admin/violations">Buat catatan pelanggaran</Link></Button>
      </div>

      <form method="get" className="mb-5 flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row dark:border-slate-800 dark:bg-slate-900">
        <input name="date" type="date" defaultValue={date} className="h-10 rounded-md border px-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
        <select name="classId" defaultValue={classId} className="h-10 rounded-md border px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
          <option value="ALL">Semua kelas</option>
          {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <Button type="submit" variant="outline">Terapkan filter</Button>
      </form>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 dark:bg-slate-950 dark:text-gray-400">
            <tr><th className="px-4 py-3">Siswa</th><th className="px-4 py-3">Jam Datang</th><th className="px-4 py-3">Alasan</th><th className="px-4 py-3">Tindakan Piket</th></tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {records.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">Tidak ada catatan pada filter ini.</td></tr>
            ) : records.map((record) => (
              <tr key={record.id}>
                <td className="px-4 py-3"><p className="font-medium">{record.student.user.name}</p><p className="text-xs text-gray-400">{record.student.class?.name ?? "-"}</p></td>
                <td className="px-4 py-3 font-medium">{timeLabel(record.arrivalTime)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{record.reason || "-"}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{record.sanction || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
