import { CalendarDays } from "lucide-react";
import { requireAuth } from "@/lib/session";
import { getLessonScheduleData } from "./actions";
import { LessonScheduleClient } from "./LessonScheduleClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jadwal Mata Pelajaran" };

export default async function LessonSchedulesPage() {
  await requireAuth("KURIKULUM");
  const data = await getLessonScheduleData();

  return (
    <div className="min-w-0 p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-text dark:bg-brand/10 dark:text-brand-text">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Jadwal Mata Pelajaran</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Susun jadwal per kelas dan pantau seluruh jadwal sekolah dalam satu tempat.</p>
        </div>
      </div>

      <LessonScheduleClient
        schedules={data.schedules.map((schedule) => ({
          id: schedule.id,
          academicYearId: schedule.academicYearId,
          classId: schedule.classId,
          subjectId: schedule.subjectId,
          teacherId: schedule.teacherId,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          room: schedule.room,
          note: schedule.note,
          academicYear: schedule.academicYear,
          class: schedule.class,
          subject: schedule.subject,
          teacher: schedule.teacher,
        }))}
        academicYears={data.academicYears.map((year) => ({ id: year.id, year: year.year, semester: year.semester, isActive: year.isActive }))}
        classes={data.classes}
        subjects={data.subjects}
        teachers={data.teachers}
        teachingAssignments={data.teachingAssignments}
      />
    </div>
  );
}
