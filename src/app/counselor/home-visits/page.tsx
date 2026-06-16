import { listHomeVisits } from "../bk-actions";
import { listStudents } from "../actions";
import { HomeVisitsClient } from "./HomeVisitsClient";

export const dynamic = "force-dynamic";

export default async function HomeVisitsPage() {
  const [visits, students] = await Promise.all([
    listHomeVisits().catch(() => []),
    listStudents().catch(() => []),
  ]);
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Kunjungan Rumah</h1>
        <p className="text-sm text-gray-500">Catat dan kelola kegiatan kunjungan rumah (home visit) siswa.</p>
      </div>
      <HomeVisitsClient visits={visits} students={students} />
    </div>
  );
}
