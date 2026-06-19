"use server";

import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function getSubjects() {
  return prisma.subject.findMany({
    orderBy: { code: "asc" },
    include: {
      major: { select: { name: true, code: true } },
      _count: { select: { questions: true, exams: true, teachers: true } },
    },
  });
}

export async function getMajorsForSelect() {
  return prisma.major.findMany({
    orderBy: { code: "asc" },
    select: { id: true, name: true, code: true },
  });
}

export async function createSubject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const majorId = String(formData.get("majorId") ?? "").trim();
  if (!name || !code) return { error: "Nama dan kode wajib diisi" };

  try {
    const created = await prisma.subject.create({
      data: { name, code, majorId: majorId || null },
    });
    await logAudit({
      action: "CREATE_SUBJECT",
      entity: "subject",
      entityId: created.id,
      details: { name, code, majorId: majorId || null },
    });
    revalidatePath("/admin/subjects");
    return { success: true };
  } catch {
    return { error: "Kode mata pelajaran sudah digunakan" };
  }
}

export async function updateSubject(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const majorId = String(formData.get("majorId") ?? "").trim();
  if (!name || !code) return { error: "Nama dan kode wajib diisi" };

  try {
    await prisma.subject.update({
      where: { id },
      data: { name, code, majorId: majorId || null },
    });
    await logAudit({
      action: "UPDATE_SUBJECT",
      entity: "subject",
      entityId: id,
      details: { name, code, majorId: majorId || null },
    });
    revalidatePath("/admin/subjects");
    return { success: true };
  } catch {
    return { error: "Gagal memperbarui mata pelajaran" };
  }
}

export async function deleteSubject(id: string) {
  try {
    const deleted = await prisma.subject.delete({ where: { id } });
    await logAudit({
      action: "DELETE_SUBJECT",
      entity: "subject",
      entityId: id,
      details: { name: deleted.name, code: deleted.code, majorId: deleted.majorId },
    });
    revalidatePath("/admin/subjects");
    return { success: true };
  } catch {
    return { error: "Tidak dapat menghapus. Mata pelajaran masih dipakai data lain." };
  }
}
