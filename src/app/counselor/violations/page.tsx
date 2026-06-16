import { listViolations, listViolationTypes, listStudents } from "../actions";
import { ViolationsClient } from "./ViolationsClient";

export const dynamic = "force-dynamic";

export default async function ViolationsPage() {
  const [violations, types, students] = await Promise.all([
    listViolations().catch(() => []),
    listViolationTypes().catch(() => []),
    listStudents().catch(() => []),
  ]);
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Pelanggaran Siswa</h1>
        <p className="text-sm text-gray-500">Catat pelanggaran & kelola poin pelanggaran siswa.</p>
      </div>
      <ViolationsClient violations={violations} types={types} students={students} />
    </div>
  );
}
