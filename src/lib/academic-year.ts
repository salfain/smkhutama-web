import { prisma } from "@/lib/prisma";

export async function getCurrentAcademicYear() {
  return prisma.academicYear.findFirst({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });
}

export async function requireCurrentAcademicYearId() {
  const academicYear = await getCurrentAcademicYear();
  if (!academicYear) {
    throw new Error("Tahun ajaran belum tersedia. Kurikulum harus membuat tahun ajaran terlebih dahulu.");
  }
  return academicYear.id;
}
