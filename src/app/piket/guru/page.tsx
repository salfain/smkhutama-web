import { requirePiketAuth } from "@/lib/session";
import { getAttendanceData } from "../actions";
import { AttendanceClient } from "./AttendanceClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kehadiran Guru – Piket" };

export default async function GuruPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requirePiketAuth();
  const sp = await searchParams;
  const { records, teachers, classes } = await getAttendanceData(sp.date);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Kehadiran Guru</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Catat kehadiran guru di kelas hari ini.</p>
      </div>
      <AttendanceClient
        records={records.map((r) => ({
          id: r.id,
          teacherName: r.teacher.user.name,
          className: r.class.name,
          status: r.status,
          period: r.period,
          substitute: r.substitute,
          note: r.note,
          createdAt: r.createdAt,
        }))}
        teachers={teachers.map((t) => ({ id: t.id, name: t.user.name }))}
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
