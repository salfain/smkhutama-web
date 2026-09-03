import { Award } from "lucide-react";
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
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
          <Award className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Prestasi Siswa</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Daftar prestasi dan poin positif siswa (baca saja).</p>
        </div>
      </div>
      <AchievementsClient achievements={achievements} students={students} readOnly />
    </div>
  );
}
