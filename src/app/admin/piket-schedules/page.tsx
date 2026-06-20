import { requireAuth } from "@/lib/session";
import { getPiketScheduleData } from "./actions";
import { PiketScheduleClient } from "./PiketScheduleClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jadwal Piket – Admin" };

export default async function PiketSchedulePage() {
  await requireAuth("ADMIN");
  const { schedules, teachers } = await getPiketScheduleData();

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">
          Jadwal Guru Piket
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Atur jadwal piket mingguan. Guru yang tidak terjadwal pada hari itu tidak dapat login ke modul Piket.
        </p>
      </div>

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800/40 p-4 text-sm text-amber-800 dark:text-amber-300">
        <strong>Cara kerja:</strong> Guru login ke sistem Piket menggunakan akun Guru biasa.
        Jika hari ini tidak ada jadwal piket untuk guru tersebut, login akan ditolak otomatis.
      </div>

      <PiketScheduleClient
        schedules={schedules.map((s) => ({
          id: s.id,
          dayOfWeek: s.dayOfWeek,
          isActive: s.isActive,
          note: s.note,
          teacher: { user: { name: s.teacher.user.name } },
        }))}
        teachers={teachers.map((t) => ({
          id: t.id,
          user: { name: t.user.name },
        }))}
      />
    </div>
  );
}
