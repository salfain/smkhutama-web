import type { AssignmentType, Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const PERMISSION_KEYS = [
  "foundation.manage",
  "assignments.manage",
  "permissions.manage",
  "notifications.send",
  "audit.view",
  "bk.sensitive.view",
  "bk.sensitive.print",
  "bk.sensitive.export",
  "curriculum.manage",
  "student_affairs.manage",
  "cbt.manage",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

const ROLE_DEFAULTS: Partial<Record<Role, readonly PermissionKey[]>> = {
  ADMIN: ["foundation.manage", "assignments.manage", "permissions.manage", "notifications.send", "audit.view"],
  KURIKULUM: ["curriculum.manage"],
  KESISWAAN: ["student_affairs.manage"],
  ADMIN_CBT: ["cbt.manage"],
  COUNSELOR: ["bk.sensitive.view", "bk.sensitive.print", "bk.sensitive.export"],
};

const ASSIGNMENT_PERMISSIONS: Partial<Record<AssignmentType, readonly PermissionKey[]>> = {
  KURIKULUM: ["curriculum.manage"],
  KESISWAAN: ["student_affairs.manage"],
  ADMIN_CBT: ["cbt.manage"],
  COUNSELOR: ["bk.sensitive.view", "bk.sensitive.print", "bk.sensitive.export"],
  LEADERSHIP: ["audit.view"],
};

export async function hasPermission(userId: string, role: Role, key: PermissionKey) {
  const override = await prisma.userPermission.findFirst({
    where: {
      userId,
      permission: { key },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { allowed: true },
  });
  if (override) return override.allowed;

  if (ROLE_DEFAULTS[role]?.includes(key)) return true;

  const assignmentTypes = Object.entries(ASSIGNMENT_PERMISSIONS)
    .filter(([, permissions]) => permissions?.includes(key))
    .map(([type]) => type as AssignmentType);
  if (assignmentTypes.length === 0) return false;

  const now = new Date();
  const assignment = await prisma.userAssignment.findFirst({
    where: {
      userId,
      type: { in: assignmentTypes },
      isActive: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        { OR: [{ academicYearId: null }, { academicYear: { isActive: true } }] },
      ],
    },
    select: { id: true },
  });
  return Boolean(assignment);
}

export async function requirePermission(key: PermissionKey) {
  const user = await getSession();
  if (!user || !(await hasPermission(user.id, user.role, key))) redirect("/login");
  return user;
}
