import { listCases, listStudents } from "../actions";
import { CasesClient } from "./CasesClient";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const [cases, students] = await Promise.all([
    listCases().catch(() => []),
    listStudents().catch(() => []),
  ]);
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Sesi Konseling</h1>
        <p className="text-sm text-gray-500">Catat dan kelola sesi bimbingan konseling siswa.</p>
      </div>
      <CasesClient cases={cases} students={students} />
    </div>
  );
}
