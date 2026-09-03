"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

type AssignmentInput = {
  academicYearId: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  weeklyPeriods: number;
  note: string | null;
  isActive: boolean;
};

export async function getTeachingAssignmentData() {
  await requireAuth("KURIKULUM");

  const [assignments, academicYears, teachers, subjects, classes] = await Promise.all([
    prisma.teachingAssignment.findMany({
      include: {
        academicYear: { select: { year: true, semester: true, isActive: true } },
        teacher: { select: { user: { select: { name: true } } } },
        subject: { select: { name: true, code: true } },
        class: { select: { name: true, grade: true, major: { select: { code: true } } } },
      },
      orderBy: [
        { academicYear: { isActive: "desc" } },
        { class: { grade: "asc" } },
        { class: { name: "asc" } },
        { subject: { code: "asc" } },
      ],
    }),
    prisma.academicYear.findMany({
      select: { id: true, year: true, semester: true, isActive: true },
      orderBy: [{ isActive: "desc" }, { year: "desc" }, { semester: "asc" }],
    }),
    prisma.teacher.findMany({
      select: { id: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.subject.findMany({
      select: { id: true, name: true, code: true, majorId: true },
      orderBy: { code: "asc" },
    }),
    prisma.class.findMany({
      select: { id: true, name: true, grade: true, majorId: true, major: { select: { code: true } } },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
    }),
  ]);

  return { assignments, academicYears, teachers, subjects, classes };
}

export async function createTeachingAssignment(formData: FormData) {
  await requireAuth("KURIKULUM");
  const parsed = await parseAndValidate(formData);
  if ("error" in parsed) return parsed;

  const duplicate = await findDuplicate(parsed.data);
  if (duplicate) return { error: "Pembagian mengajar yang sama sudah terdaftar." };

  try {
    const created = await prisma.teachingAssignment.create({ data: parsed.data });
    await logAudit({
      action: "CREATE_TEACHING_ASSIGNMENT",
      entity: "teaching_assignment",
      entityId: created.id,
      details: parsed.data,
    });
    revalidateAssignments();
    return { success: true };
  } catch {
    return { error: "Gagal menyimpan pembagian mengajar. Silakan periksa datanya." };
  }
}

export async function updateTeachingAssignment(id: string, formData: FormData) {
  await requireAuth("KURIKULUM");
  const parsed = await parseAndValidate(formData);
  if ("error" in parsed) return parsed;

  const current = await prisma.teachingAssignment.findUnique({ where: { id } });
  if (!current) return { error: "Pembagian mengajar tidak ditemukan." };

  const duplicate = await findDuplicate(parsed.data, id);
  if (duplicate) return { error: "Pembagian mengajar yang sama sudah terdaftar." };

  try {
    await prisma.teachingAssignment.update({ where: { id }, data: parsed.data });
    await logAudit({
      action: "UPDATE_TEACHING_ASSIGNMENT",
      entity: "teaching_assignment",
      entityId: id,
      details: { before: current, after: parsed.data },
    });
    revalidateAssignments();
    return { success: true };
  } catch {
    return { error: "Gagal memperbarui pembagian mengajar." };
  }
}

export async function toggleTeachingAssignment(id: string) {
  await requireAuth("KURIKULUM");
  const current = await prisma.teachingAssignment.findUnique({ where: { id } });
  if (!current) return { error: "Pembagian mengajar tidak ditemukan." };

  try {
    const updated = await prisma.teachingAssignment.update({
      where: { id },
      data: { isActive: !current.isActive },
    });
    await logAudit({
      action: "TOGGLE_TEACHING_ASSIGNMENT",
      entity: "teaching_assignment",
      entityId: id,
      details: { isActive: updated.isActive },
    });
    revalidateAssignments();
    return { success: true };
  } catch {
    return { error: "Gagal mengubah status pembagian mengajar." };
  }
}

export async function deleteTeachingAssignment(id: string) {
  await requireAuth("KURIKULUM");

  try {
    const deleted = await prisma.teachingAssignment.delete({ where: { id } });
    await logAudit({
      action: "DELETE_TEACHING_ASSIGNMENT",
      entity: "teaching_assignment",
      entityId: id,
      details: deleted,
    });
    revalidateAssignments();
    return { success: true };
  } catch {
    return { error: "Pembagian mengajar tidak ditemukan atau gagal dihapus." };
  }
}

async function parseAndValidate(formData: FormData): Promise<{ data: AssignmentInput } | { error: string }> {
  const academicYearId = String(formData.get("academicYearId") ?? "").trim();
  const teacherId = String(formData.get("teacherId") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  const classId = String(formData.get("classId") ?? "").trim();
  const weeklyPeriods = Number(formData.get("weeklyPeriods") ?? 0);
  const note = String(formData.get("note") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "true") !== "false";

  if (!academicYearId || !teacherId || !subjectId || !classId) {
    return { error: "Tahun ajaran, guru, mata pelajaran, dan kelas wajib dipilih." };
  }
  if (!Number.isInteger(weeklyPeriods) || weeklyPeriods < 1 || weeklyPeriods > 48) {
    return { error: "Jumlah jam pelajaran per minggu harus antara 1-48 JP." };
  }

  const [academicYear, teacher, subject, targetClass] = await Promise.all([
    prisma.academicYear.findUnique({ where: { id: academicYearId }, select: { id: true } }),
    prisma.teacher.findUnique({ where: { id: teacherId }, select: { id: true } }),
    prisma.subject.findUnique({ where: { id: subjectId }, select: { id: true, majorId: true } }),
    prisma.class.findUnique({ where: { id: classId }, select: { id: true, majorId: true } }),
  ]);

  if (!academicYear || !teacher || !subject || !targetClass) {
    return { error: "Salah satu data acuan sudah tidak tersedia. Muat ulang halaman." };
  }
  if (subject.majorId && subject.majorId !== targetClass.majorId) {
    return { error: "Mata pelajaran produktif hanya dapat ditugaskan ke kelas dari jurusan yang sama." };
  }

  return {
    data: {
      academicYearId,
      teacherId,
      subjectId,
      classId,
      weeklyPeriods,
      note: note || null,
      isActive,
    },
  };
}

async function findDuplicate(input: AssignmentInput, excludeId?: string) {
  return prisma.teachingAssignment.findFirst({
    where: {
      academicYearId: input.academicYearId,
      teacherId: input.teacherId,
      subjectId: input.subjectId,
      classId: input.classId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
}

function revalidateAssignments() {
  revalidatePath("/admin/teaching-assignments");
  revalidatePath("/admin/lesson-schedules");
  revalidatePath("/admin/dashboard");
  revalidatePath("/teacher/schedule");
}
