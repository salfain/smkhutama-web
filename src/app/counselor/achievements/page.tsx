import { listAchievements, listStudents } from "../actions";
import { AchievementsClient } from "./AchievementsClient";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const [achievements, students] = await Promise.all([
    listAchievements().catch(() => []),
    listStudents().catch(() => []),
  ]);
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Prestasi Siswa</h1>
        <p className="text-sm text-gray-500">Catat prestasi & poin positif siswa.</p>
      </div>
      <AchievementsClient achievements={achievements} students={students} />
    </div>
  );
}
