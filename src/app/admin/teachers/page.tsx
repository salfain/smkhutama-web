import { getTeachers, getSubjectsForSelect } from "./actions";
import { TeacherTable } from "./TeacherTable";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  const [teachers, subjects] = await Promise.all([
    getTeachers().catch(() => []),
    getSubjectsForSelect().catch(() => []),
  ]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Data Guru</h1>
        <p className="text-sm text-gray-500">{teachers.length} guru terdaftar</p>
      </div>
      <TeacherTable teachers={teachers} subjects={subjects} />
    </div>
  );
}
