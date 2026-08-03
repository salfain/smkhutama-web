import { requireAuth } from "@/lib/session";
import * as bk from "@/server/modules/bk/service";
import { toStudentOption, toViolation } from "@/server/modules/bk/dto";
import { ViolationsClient } from "@/app/counselor/violations/ViolationsClient";

export const dynamic = "force-dynamic";

export default async function AdminViolationsPage() {
  await requireAuth("KESISWAAN");

  const [rows, types, studentRows] = await Promise.all([
    bk.listViolations(),
    bk.listViolationTypes(),
    bk.listStudents(),
  ]);
  const violations = rows.map((row) => ({ ...toViolation(row), studentId: row.studentId }));
  const students = studentRows.map(toStudentOption);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Pelanggaran Siswa</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Catat dan tindak lanjuti pelanggaran siswa.</p>
      </div>
      <ViolationsClient
        violations={violations}
        types={types}
        students={students}
        canManageRecords
        canManageTypes={false}
      />
    </div>
  );
}
