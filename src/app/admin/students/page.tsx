import { getStudents, getClassesAndMajors } from "./actions";
import { StudentTable } from "./StudentTable";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const [students, { classes, majors }] = await Promise.all([
    getStudents().catch(() => []),
    getClassesAndMajors().catch(() => ({ classes: [], majors: [] })),
  ]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Data Siswa</h1>
        <p className="text-sm text-gray-500">{students.length} siswa terdaftar</p>
      </div>
      <StudentTable students={students} classes={classes} majors={majors} />
    </div>
  );
}
