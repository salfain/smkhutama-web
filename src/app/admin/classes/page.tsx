import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { getClasses, getMajorsForSelect, getTeachersForSelect } from "./actions";
import { ClassTable } from "./ClassTable";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const [classes, majors, teachers] = await Promise.all([
    getClasses().catch(() => []),
    getMajorsForSelect().catch(() => []),
    getTeachersForSelect().catch(() => []),
  ]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Kelas & Jurusan</h1>
          <p className="text-sm text-gray-500">{classes.length} kelas · {majors.length} jurusan</p>
        </div>
        <Link href="/admin/majors">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Building2 className="h-4 w-4" />Kelola Jurusan
          </Button>
        </Link>
      </div>
      <ClassTable classes={classes} majors={majors} teachers={teachers} />
    </div>
  );
}
