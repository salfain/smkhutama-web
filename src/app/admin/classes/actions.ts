"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getClasses() {
  return prisma.class.findMany({
    orderBy: [{ grade: "asc" }, { name: "asc" }],
    include: {
      major: { select: { name: true, code: true } },
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

export async function createClass(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const grade = String(formData.get("grade") ?? "").trim();
  const majorId = String(formData.get("majorId") ?? "").trim();
  if (!name || !grade || !majorId) return { error: "Semua field wajib diisi" };

  try {
    await prisma.class.create({ data: { name, grade, majorId } });
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
  if (!name || !grade || !majorId) return { error: "Semua field wajib diisi" };

  try {
    await prisma.class.update({ where: { id }, data: { name, grade, majorId } });
    revalidatePath("/admin/classes");
    return { success: true };
  } catch {
    return { error: "Gagal memperbarui kelas" };
  }
}

export async function deleteClass(id: string) {
  try {
    await prisma.class.delete({ where: { id } });
    revalidatePath("/admin/classes");
    return { success: true };
  } catch {
    return { error: "Tidak dapat menghapus. Kelas masih memiliki siswa." };
  }
}
