import { getMajors } from "./actions";
import { MajorTable } from "./MajorTable";

export const dynamic = "force-dynamic";

export default async function MajorsPage() {
  const majors = await getMajors().catch(() => []);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Manajemen Jurusan</h1>
        <p className="text-sm text-gray-500">{majors.length} jurusan terdaftar</p>
      </div>
      <MajorTable majors={majors} />
    </div>
  );
}
