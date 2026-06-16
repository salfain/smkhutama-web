import { getSubjects, getMajorsForSelect } from "./actions";
import { SubjectTable } from "./SubjectTable";

export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const [subjects, majors] = await Promise.all([
    getSubjects().catch(() => []),
    getMajorsForSelect().catch(() => []),
  ]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Mata Pelajaran</h1>
        <p className="text-sm text-gray-500">{subjects.length} mata pelajaran terdaftar</p>
      </div>
      <SubjectTable subjects={subjects} majors={majors} />
    </div>
  );
}
