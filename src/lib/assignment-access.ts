import type { AssignmentType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

function activeAssignmentWhere(userId: string, now = new Date()): Prisma.UserAssignmentWhereInput {
  return {
    userId,
    isActive: true,
    AND: [
      { OR: [{ startDate: null }, { startDate: { lte: now } }] },
      { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      { OR: [{ academicYearId: null }, { academicYear: { isActive: true } }] },
    ],
  };
}

/** Penugasan hanya berlaku pada rentang tanggal dan tahun ajaran aktifnya. */
export async function getActiveAssignmentTypes(userId: string) {
  const assignments = await prisma.userAssignment.findMany({
    where: activeAssignmentWhere(userId),
    distinct: ["type"],
    select: { type: true },
  });
  return assignments.map((assignment) => assignment.type);
}

export async function hasActiveAssignment(userId: string, type: AssignmentType) {
  const assignment = await prisma.userAssignment.findFirst({
    where: { ...activeAssignmentWhere(userId), type },
    select: { id: true },
  });
  return Boolean(assignment);
}
