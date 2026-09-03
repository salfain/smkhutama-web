"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { timeRangesOverlap } from "@/lib/lesson-schedule";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

type ScheduleInput = {
  academicYearId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  note: string | null;
};

export async function getLessonScheduleData() {
  await requireAuth("KURIKULUM");

  const [schedules, academicYears, classes, subjects, teachers, teachingAssignments] = await Promise.all([
    prisma.lessonSchedule.findMany({
      include: {
        academicYear: { select: { year: true, semester: true, isActive: true } },
        class: { select: { name: true, grade: true } },
        subject: { select: { name: true, code: true } },
        teacher: { select: { user: { select: { name: true } } } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }, { class: { name: "asc" } }],
    }),
    prisma.academicYear.findMany({ orderBy: [{ isActive: "desc" }, { year: "desc" }, { semester: "asc" }] }),
    prisma.class.findMany({
      select: { id: true, name: true, grade: true, major: { select: { code: true } } },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
    }),
    prisma.subject.findMany({ select: { id: true, name: true, code: true }, orderBy: { code: "asc" } }),
    prisma.teacher.findMany({
      select: { id: true, user: { select: { name: true } }, subject: { select: { name: true, code: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.teachingAssignment.findMany({
      where: { isActive: true },
      select: { id: true, academicYearId: true, classId: true, subjectId: true, teacherId: true, weeklyPeriods: true },
    }),
  ]);

  return { schedules, academicYears, classes, subjects, teachers, teachingAssignments };
}

export async function createLessonSchedule(formData: FormData) {
  await requireAuth("KURIKULUM");
  const parsed = parseInput(formData);
  if ("error" in parsed) return parsed;

  const assignmentError = await validateTeachingAssignment(parsed.data);
  if (assignmentError) return { error: assignmentError };

  const conflict = await findConflict(parsed.data);
  if (conflict) return { error: conflict };

  try {
    const created = await prisma.lessonSchedule.create({ data: parsed.data });
    await logAudit({
      action: "CREATE_LESSON_SCHEDULE",
      entity: "lesson_schedule",
      entityId: created.id,
      details: parsed.data,
    });
    revalidateSchedules();
    return { success: true };
  } catch {
    return { error: "Gagal membuat jadwal. Pastikan semua data masih tersedia." };
  }
}

export async function updateLessonSchedule(id: string, formData: FormData) {
  await requireAuth("KURIKULUM");
  const parsed = parseInput(formData);
  if ("error" in parsed) return parsed;

  const current = await prisma.lessonSchedule.findUnique({ where: { id } });
  if (!current) return { error: "Jadwal tidak ditemukan." };

  const assignmentError = await validateTeachingAssignment(parsed.data);
  if (assignmentError) return { error: assignmentError };

  const conflict = await findConflict(parsed.data, id);
  if (conflict) return { error: conflict };

  try {
    await prisma.lessonSchedule.update({ where: { id }, data: parsed.data });
    await logAudit({
      action: "UPDATE_LESSON_SCHEDULE",
      entity: "lesson_schedule",
      entityId: id,
      details: { before: current, after: parsed.data },
    });
    revalidateSchedules();
    return { success: true };
  } catch {
    return { error: "Gagal memperbarui jadwal." };
  }
}

export async function deleteLessonSchedule(id: string) {
  await requireAuth("KURIKULUM");

  try {
    const deleted = await prisma.lessonSchedule.delete({ where: { id } });
    await logAudit({
      action: "DELETE_LESSON_SCHEDULE",
      entity: "lesson_schedule",
      entityId: id,
      details: deleted,
    });
    revalidateSchedules();
    return { success: true };
  } catch {
    return { error: "Jadwal tidak ditemukan atau gagal dihapus." };
  }
}

function parseInput(formData: FormData): { data: ScheduleInput } | { error: string } {
  const academicYearId = String(formData.get("academicYearId") ?? "").trim();
  const classId = String(formData.get("classId") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  const teacherId = String(formData.get("teacherId") ?? "").trim();
  const dayOfWeek = Number(formData.get("dayOfWeek") ?? 0);
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const room = String(formData.get("room") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!academicYearId || !classId || !subjectId || !teacherId) {
    return { error: "Tahun ajaran, kelas, mata pelajaran, dan guru wajib dipilih." };
  }
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 6) {
    return { error: "Hari tidak valid." };
  }
  if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
    return { error: "Jam mulai dan selesai wajib menggunakan format HH:mm." };
  }
  if (startTime >= endTime) return { error: "Jam selesai harus lebih besar dari jam mulai." };

  return {
    data: {
      academicYearId,
      classId,
      subjectId,
      teacherId,
      dayOfWeek,
      startTime,
      endTime,
      room: room || null,
      note: note || null,
    },
  };
}

async function findConflict(input: ScheduleInput, excludeId?: string) {
  const candidates = await prisma.lessonSchedule.findMany({
    where: {
      academicYearId: input.academicYearId,
      dayOfWeek: input.dayOfWeek,
      isActive: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      OR: [{ classId: input.classId }, { teacherId: input.teacherId }],
    },
    select: {
      classId: true,
      teacherId: true,
      startTime: true,
      endTime: true,
      class: { select: { name: true } },
      teacher: { select: { user: { select: { name: true } } } },
    },
  });

  const overlap = candidates.find((schedule) => timeRangesOverlap(input.startTime, input.endTime, schedule.startTime, schedule.endTime));
  if (!overlap) return null;
  if (overlap.classId === input.classId) {
    return `Kelas ${overlap.class.name} sudah memiliki jadwal pukul ${overlap.startTime}–${overlap.endTime}.`;
  }
  return `Guru ${overlap.teacher.user.name} sudah mengajar pukul ${overlap.startTime}–${overlap.endTime}.`;
}

async function validateTeachingAssignment(input: ScheduleInput) {
  const activeAssignments = await prisma.teachingAssignment.findMany({
    where: {
      academicYearId: input.academicYearId,
      classId: input.classId,
      isActive: true,
    },
    select: { subjectId: true, teacherId: true },
  });
  if (activeAssignments.length === 0) return null;

  const isAssigned = activeAssignments.some(
    (item) => item.subjectId === input.subjectId && item.teacherId === input.teacherId,
  );
  return isAssigned
    ? null
    : "Kombinasi guru, mata pelajaran, dan kelas belum terdaftar pada Pembagian Mengajar.";
}

function revalidateSchedules() {
  revalidatePath("/admin/lesson-schedules");
  revalidatePath("/teacher/schedule");
  revalidatePath("/student/schedule");
}
