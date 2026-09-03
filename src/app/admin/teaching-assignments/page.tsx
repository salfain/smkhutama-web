import { ClipboardList } from "lucide-react";
import { requireAuth } from "@/lib/session";
import { getTeachingAssignmentData } from "./actions";
import { TeachingAssignmentsClient } from "./TeachingAssignmentsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pembagian Mengajar" };

export default async function TeachingAssignmentsPage() {
  await requireAuth("KURIKULUM");
  const data = await getTeachingAssignmentData();

  return (
    <div className="min-w-0 p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-text dark:bg-brand/10">
          <ClipboardList className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Pembagian Tugas Mengajar</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tetapkan guru, mata pelajaran, kelas, dan alokasi jam sebagai dasar penyusunan jadwal.
          </p>
        </div>
      </div>

      <TeachingAssignmentsClient
        assignments={data.assignments.map((item) => ({
          id: item.id,
          academicYearId: item.academicYearId,
          teacherId: item.teacherId,
          subjectId: item.subjectId,
          classId: item.classId,
          weeklyPeriods: item.weeklyPeriods,
          note: item.note,
          isActive: item.isActive,
          academicYear: item.academicYear,
          teacher: item.teacher,
          subject: item.subject,
          class: item.class,
        }))}
        academicYears={data.academicYears}
        teachers={data.teachers}
        subjects={data.subjects}
        classes={data.classes}
      />
    </div>
  );
}
