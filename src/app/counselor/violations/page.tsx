import { ShieldAlert } from "lucide-react";
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
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Pelanggaran Siswa</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tinjau catatan siswa dan kelola master jenis pelanggaran.</p>
        </div>
      </div>
      <ViolationsClient
        violations={violations}
        types={types}
        students={students}
        canManageRecords={false}
        canManageTypes
      />
    </div>
  );
}
