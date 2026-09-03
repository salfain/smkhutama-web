import { Home } from "lucide-react";
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
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
          <Home className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Kunjungan Rumah</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Catat dan kelola kegiatan kunjungan rumah (home visit) siswa.</p>
        </div>
      </div>
      <HomeVisitsClient visits={visits} students={students} />
    </div>
  );
}
