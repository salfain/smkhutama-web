import { getPiketScheduleData } from "./actions";
import { PiketScheduleClient } from "./PiketScheduleClient";

export const metadata = { title: "Jadwal Piket - Admin" };

export default async function AdminPiketSchedulesPage() {
  const { teachers, schedules } = await getPiketScheduleData();

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Jadwal Piket Guru</h1>
        <p className="text-sm text-gray-500">
          Tentukan guru yang boleh masuk ke modul Guru Piket berdasarkan jadwal mingguan.
        </p>
      </div>

      <PiketScheduleClient teachers={teachers} schedules={schedules} />
    </div>
  );
}
