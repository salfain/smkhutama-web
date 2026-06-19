"use server";

import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function getMajors() {
  return prisma.major.findMany({
    orderBy: { code: "asc" },
    include: { _count: { select: { classes: true, students: true } } },
  });
}

export async function createMajor(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!name || !code) return { error: "Nama dan kode wajib diisi" };

  try {
    const created = await prisma.major.create({ data: { name, code } });
    await logAudit({
      action: "CREATE_MAJOR",
      entity: "major",
      entityId: created.id,
      details: { name, code },
    });
    revalidatePath("/admin/majors");
    revalidatePath("/admin/classes");
    return { success: true };
  } catch (e: unknown) {
    return { error: "Kode jurusan sudah digunakan" };
  }
}

export async function updateMajor(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!name || !code) return { error: "Nama dan kode wajib diisi" };

  try {
    await prisma.major.update({ where: { id }, data: { name, code } });
    await logAudit({
      action: "UPDATE_MAJOR",
      entity: "major",
      entityId: id,
      details: { name, code },
    });
    revalidatePath("/admin/majors");
    return { success: true };
  } catch {
    return { error: "Gagal memperbarui jurusan" };
  }
}

export async function deleteMajor(id: string) {
  try {
    const deleted = await prisma.major.delete({ where: { id } });
    await logAudit({
      action: "DELETE_MAJOR",
      entity: "major",
      entityId: id,
      details: { name: deleted.name, code: deleted.code },
    });
    revalidatePath("/admin/majors");
    return { success: true };
  } catch {
    return { error: "Tidak dapat menghapus. Jurusan masih dipakai data lain." };
  }
}
