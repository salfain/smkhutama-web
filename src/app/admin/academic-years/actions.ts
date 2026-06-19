"use server";

import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function getAcademicYears() {
  return prisma.academicYear.findMany({
    orderBy: [{ year: "desc" }, { semester: "asc" }],
    include: { _count: { select: { exams: true } } },
  });
}

export async function createAcademicYear(formData: FormData) {
  const year = String(formData.get("year") ?? "").trim();
  const semester = String(formData.get("semester") ?? "").trim() as "GANJIL" | "GENAP";
  const isActive = formData.get("isActive") === "on";

  if (!year || !semester) return { error: "Tahun dan semester wajib diisi" };

  try {
    if (isActive) {
      await prisma.academicYear.updateMany({ data: { isActive: false } });
    }
    const created = await prisma.academicYear.create({ data: { year, semester, isActive } });
    await logAudit({
      action: "CREATE_ACADEMIC_YEAR",
      entity: "academicYear",
      entityId: created.id,
      details: { year, semester, isActive },
    });
    revalidatePath("/admin/academic-years");
    return { success: true };
  } catch {
    return { error: "Gagal menambah tahun ajaran" };
  }
}

export async function updateAcademicYear(id: string, formData: FormData) {
  const year = String(formData.get("year") ?? "").trim();
  const semester = String(formData.get("semester") ?? "").trim() as "GANJIL" | "GENAP";
  const isActive = formData.get("isActive") === "on";

  if (!year || !semester) return { error: "Tahun dan semester wajib diisi" };

  try {
    if (isActive) {
      await prisma.academicYear.updateMany({
        where: { id: { not: id } },
        data: { isActive: false },
      });
    }
    await prisma.academicYear.update({
      where: { id },
      data: { year, semester, isActive },
    });
    await logAudit({
      action: "UPDATE_ACADEMIC_YEAR",
      entity: "academicYear",
      entityId: id,
      details: { year, semester, isActive },
    });
    revalidatePath("/admin/academic-years");
    return { success: true };
  } catch {
    return { error: "Gagal memperbarui tahun ajaran" };
  }
}

export async function setActiveAcademicYear(id: string) {
  try {
    await prisma.academicYear.updateMany({ data: { isActive: false } });
    const updated = await prisma.academicYear.update({ where: { id }, data: { isActive: true } });
    await logAudit({
      action: "SET_ACTIVE_ACADEMIC_YEAR",
      entity: "academicYear",
      entityId: id,
      details: { year: updated.year, semester: updated.semester },
    });
    revalidatePath("/admin/academic-years");
    return { success: true };
  } catch {
    return { error: "Gagal mengaktifkan tahun ajaran" };
  }
}

export async function deleteAcademicYear(id: string) {
  try {
    const deleted = await prisma.academicYear.delete({ where: { id } });
    await logAudit({
      action: "DELETE_ACADEMIC_YEAR",
      entity: "academicYear",
      entityId: id,
      details: { year: deleted.year, semester: deleted.semester },
    });
    revalidatePath("/admin/academic-years");
    return { success: true };
  } catch {
    return { error: "Tidak dapat menghapus. Tahun ajaran masih dipakai data ujian." };
  }
}
