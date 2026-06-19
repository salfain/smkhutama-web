"use server";

import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function getClasses() {
  return prisma.class.findMany({
    orderBy: [{ grade: "asc" }, { name: "asc" }],
    include: {
      major: { select: { name: true, code: true } },
      homeroomTeacher: { include: { user: { select: { name: true } } } },
      _count: { select: { students: true } },
    },
  });
}

export async function getMajorsForSelect() {
  return prisma.major.findMany({
    orderBy: { code: "asc" },
    select: { id: true, name: true, code: true },
  });
}

export async function getTeachersForSelect() {
  const teachers = await prisma.teacher.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });
  return teachers.map((t) => ({ id: t.id, name: t.user.name }));
}

export async function createClass(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const grade = String(formData.get("grade") ?? "").trim();
  const majorId = String(formData.get("majorId") ?? "").trim();
  const homeroomTeacherId = String(formData.get("homeroomTeacherId") ?? "").trim();
  if (!name || !grade || !majorId) return { error: "Semua field wajib diisi" };

  try {
    const created = await prisma.class.create({ data: { name, grade, majorId, homeroomTeacherId: homeroomTeacherId || null } });
    await logAudit({
      action: "CREATE_CLASS",
      entity: "class",
      entityId: created.id,
      details: { name, grade, majorId, homeroomTeacherId: homeroomTeacherId || null },
    });
    revalidatePath("/admin/classes");
    return { success: true };
  } catch {
    return { error: "Gagal menambah kelas" };
  }
}

export async function updateClass(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const grade = String(formData.get("grade") ?? "").trim();
  const majorId = String(formData.get("majorId") ?? "").trim();
  const homeroomTeacherId = String(formData.get("homeroomTeacherId") ?? "").trim();
  if (!name || !grade || !majorId) return { error: "Semua field wajib diisi" };

  try {
    await prisma.class.update({ where: { id }, data: { name, grade, majorId, homeroomTeacherId: homeroomTeacherId || null } });
    await logAudit({
      action: "UPDATE_CLASS",
      entity: "class",
      entityId: id,
      details: { name, grade, majorId, homeroomTeacherId: homeroomTeacherId || null },
    });
    revalidatePath("/admin/classes");
    return { success: true };
  } catch {
    return { error: "Gagal memperbarui kelas" };
  }
}

export async function deleteClass(id: string) {
  try {
    const deleted = await prisma.class.delete({ where: { id } });
    await logAudit({
      action: "DELETE_CLASS",
      entity: "class",
      entityId: id,
      details: { name: deleted.name, grade: deleted.grade, majorId: deleted.majorId },
    });
    revalidatePath("/admin/classes");
    return { success: true };
  } catch {
    return { error: "Tidak dapat menghapus. Kelas masih memiliki siswa." };
  }
}
