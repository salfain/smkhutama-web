"use server";

import { prisma } from "@/lib/prisma";
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
    await prisma.academicYear.create({ data: { year, semester, isActive } });
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
    revalidatePath("/admin/academic-years");
    return { success: true };
  } catch {
    return { error: "Gagal memperbarui tahun ajaran" };
  }
}

export async function setActiveAcademicYear(id: string) {
  try {
    await prisma.academicYear.updateMany({ data: { isActive: false } });
    await prisma.academicYear.update({ where: { id }, data: { isActive: true } });
    revalidatePath("/admin/academic-years");
    return { success: true };
  } catch {
    return { error: "Gagal mengaktifkan tahun ajaran" };
  }
}

export async function deleteAcademicYear(id: string) {
  try {
    await prisma.academicYear.delete({ where: { id } });
    revalidatePath("/admin/academic-years");
    return { success: true };
  } catch {
    return { error: "Tidak dapat menghapus. Tahun ajaran masih dipakai data ujian." };
  }
}
