import { CalendarDays } from "lucide-react";
import { redirect } from "next/navigation";
import { WeeklyLessonSchedule } from "@/components/schedules/WeeklyLessonSchedule";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jadwal Mengajar" };

export default async function TeacherSchedulePage() {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) redirect("/login");

  const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
  const schedules = activeYear ? await prisma.lessonSchedule.findMany({
    where: { teacherId: user.teacher.id, academicYearId: activeYear.id, isActive: true },
    include: { class: { select: { name: true } }, subject: { select: { name: true, code: true } } },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  }) : [];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">Ruang kerja guru</p>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Jadwal Mengajar</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Jadwal mata pelajaran dan kelas yang Anda ampu.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E8E8EC] bg-white px-3 py-1.5 text-xs text-gray-500 dark:border-white/10 dark:bg-[#19191C] dark:text-gray-400">
          <CalendarDays className="h-3.5 w-3.5" /> {activeYear ? `${activeYear.year} · ${activeYear.semester === "GANJIL" ? "Ganjil" : "Genap"}` : "Tahun ajaran belum aktif"}
        </span>
      </div>
      <WeeklyLessonSchedule
        items={schedules.map((schedule) => ({
          id: schedule.id,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          subjectName: schedule.subject.name,
          subjectCode: schedule.subject.code,
          context: schedule.class.name,
          room: schedule.room,
          note: schedule.note,
        }))}
        emptyText="Hubungi bagian Kurikulum jika jadwal belum diatur."
      />
    </div>
  );
}
