import { requireAuth } from "@/lib/session";
import * as bk from "@/server/modules/bk/service";
import { toAchievement, toStudentOption } from "@/server/modules/bk/dto";
import { AchievementsClient } from "@/app/counselor/achievements/AchievementsClient";

export const dynamic = "force-dynamic";

export default async function AdminAchievementsPage() {
  await requireAuth("KESISWAAN");

  const [rows, studentRows] = await Promise.all([bk.listAchievements(), bk.listStudents()]);
  const achievements = rows.map((row) => ({ ...toAchievement(row), studentId: row.studentId }));
  const students = studentRows.map(toStudentOption);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Prestasi Siswa</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Catat prestasi dan poin positif siswa.</p>
      </div>
      <AchievementsClient achievements={achievements} students={students} readOnly={false} />
    </div>
  );
}
