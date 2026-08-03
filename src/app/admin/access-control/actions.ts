"use server";

import type { AssignmentType, NotificationType } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { ASSIGNMENTS_REQUIRING_CLASS, ASSIGNMENTS_REQUIRING_MAJOR, ASSIGNMENT_OPTIONS } from "@/lib/access-control";
import { logAudit } from "@/lib/audit";
import { notifyUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

const PATH = "/admin/access-control";
const assignmentTypes = new Set(ASSIGNMENT_OPTIONS.map(([value]) => value));

export async function getAccessControlData() {
  await requireAuth("ADMIN");

  const [users, academicYears, classes, majors, permissions] = await Promise.all([
    prisma.user.findMany({
      where: { role: { not: "STUDENT" } },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        teacher: { select: { id: true } },
        assignments: {
          orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
          include: {
            academicYear: { select: { year: true, semester: true } },
            class: { select: { name: true } },
            major: { select: { code: true, name: true } },
          },
        },
        permissionOverrides: {
          include: { permission: true },
          orderBy: { permission: { category: "asc" } },
        },
      },
    }),
    prisma.academicYear.findMany({ orderBy: [{ isActive: "desc" }, { year: "desc" }] }),
    prisma.class.findMany({ orderBy: [{ grade: "asc" }, { name: "asc" }], select: { id: true, name: true, grade: true } }),
    prisma.major.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    prisma.permission.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
  ]);

  return { users, academicYears, classes, majors, permissions };
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalDate(raw: string) {
  if (!raw) return null;
  const parsed = new Date(`${raw}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function createAssignment(formData: FormData) {
  const actor = await requireAuth("ADMIN");
  const userId = value(formData, "userId");
  const rawType = value(formData, "type");
  const academicYearId = value(formData, "academicYearId") || null;
  const classId = value(formData, "classId") || null;
  const majorId = value(formData, "majorId") || null;
  const startDate = optionalDate(value(formData, "startDate"));
  const endDate = optionalDate(value(formData, "endDate"));
  const note = value(formData, "note") || null;

  if (!userId || !assignmentTypes.has(rawType as never)) return { error: "Pengguna dan jenis penugasan wajib dipilih." };
  if (startDate && endDate && startDate > endDate) return { error: "Tanggal selesai tidak boleh sebelum tanggal mulai." };

  const type = rawType as AssignmentType;
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, teacher: { select: { id: true } } } });
  if (!target) return { error: "Pengguna tidak ditemukan." };
  if (ASSIGNMENTS_REQUIRING_CLASS.includes(type as never) && !classId) return { error: "Penugasan ini wajib memilih kelas." };
  if (ASSIGNMENTS_REQUIRING_MAJOR.includes(type as never) && !majorId) return { error: "Penugasan ini wajib memilih jurusan." };
  if (type === "HOMEROOM_TEACHER" && (!classId || !target.teacher)) return { error: "Wali kelas wajib berupa akun guru dan memilih kelas." };

  const duplicate = await prisma.userAssignment.findFirst({
    where: { userId, type, academicYearId, classId, majorId, isActive: true },
    select: { id: true },
  });
  if (duplicate) return { error: "Penugasan aktif yang sama sudah tersedia." };

  const created = await prisma.$transaction(async (tx) => {
    if (type === "HOMEROOM_TEACHER" && classId && target.teacher) {
      await tx.userAssignment.updateMany({
        where: { type: "HOMEROOM_TEACHER", classId, academicYearId, isActive: true },
        data: { isActive: false },
      });
      await tx.class.update({ where: { id: classId }, data: { homeroomTeacherId: target.teacher.id } });
    }
    return tx.userAssignment.create({
      data: { userId, type, academicYearId, classId, majorId, startDate, endDate, note, createdById: actor.id },
    });
  });

  await notifyUser({ userId, type: "INFO", title: "Penugasan baru", message: `Anda mendapat penugasan ${rawType.replaceAll("_", " ")}.`, href: "/" });
  await logAudit({ userId: actor.id, action: "CREATE_ASSIGNMENT", entity: "user_assignment", entityId: created.id, details: { userId, type, academicYearId, classId, majorId } });
  revalidatePath(PATH);
  return { success: true };
}

export async function toggleAssignment(id: string) {
  const actor = await requireAuth("ADMIN");
  const current = await prisma.userAssignment.findUnique({ where: { id }, include: { user: { include: { teacher: true } } } });
  if (!current) return { error: "Penugasan tidak ditemukan." };
  const nextActive = !current.isActive;

  await prisma.$transaction(async (tx) => {
    if (nextActive && current.type === "HOMEROOM_TEACHER" && current.classId) {
      await tx.userAssignment.updateMany({
        where: { id: { not: id }, type: "HOMEROOM_TEACHER", classId: current.classId, academicYearId: current.academicYearId, isActive: true },
        data: { isActive: false },
      });
    }
    await tx.userAssignment.update({ where: { id }, data: { isActive: nextActive } });
    if (current.type === "HOMEROOM_TEACHER" && current.classId && current.user.teacher) {
      await tx.class.update({
        where: { id: current.classId },
        data: { homeroomTeacherId: nextActive ? current.user.teacher.id : null },
      });
    }
  });
  await logAudit({ userId: actor.id, action: nextActive ? "ACTIVATE_ASSIGNMENT" : "DEACTIVATE_ASSIGNMENT", entity: "user_assignment", entityId: id });
  revalidatePath(PATH);
  return { success: true };
}

export async function deleteAssignment(id: string) {
  const actor = await requireAuth("ADMIN");
  const current = await prisma.userAssignment.findUnique({ where: { id }, include: { user: { include: { teacher: true } } } });
  if (!current) return { error: "Penugasan tidak ditemukan." };

  await prisma.$transaction(async (tx) => {
    await tx.userAssignment.delete({ where: { id } });
    if (current.type === "HOMEROOM_TEACHER" && current.classId && current.user.teacher) {
      const cls = await tx.class.findUnique({ where: { id: current.classId }, select: { homeroomTeacherId: true } });
      if (cls?.homeroomTeacherId === current.user.teacher.id) {
        await tx.class.update({ where: { id: current.classId }, data: { homeroomTeacherId: null } });
      }
    }
  });
  await logAudit({ userId: actor.id, action: "DELETE_ASSIGNMENT", entity: "user_assignment", entityId: id, details: { userId: current.userId, type: current.type } });
  revalidatePath(PATH);
  return { success: true };
}

export async function setPermissionOverride(userId: string, permissionKey: string, state: "DEFAULT" | "ALLOW" | "DENY") {
  const actor = await requireAuth("ADMIN");
  const permission = await prisma.permission.findUnique({ where: { key: permissionKey } });
  if (!permission) return { error: "Permission tidak ditemukan." };

  if (state === "DEFAULT") {
    await prisma.userPermission.deleteMany({ where: { userId, permissionId: permission.id } });
  } else {
    await prisma.userPermission.upsert({
      where: { userId_permissionId: { userId, permissionId: permission.id } },
      update: { allowed: state === "ALLOW", grantedById: actor.id, expiresAt: null },
      create: { userId, permissionId: permission.id, allowed: state === "ALLOW", grantedById: actor.id },
    });
  }

  await logAudit({ userId: actor.id, action: "SET_PERMISSION_OVERRIDE", entity: "user_permission", entityId: userId, details: { permissionKey, state } });
  revalidatePath(PATH);
  return { success: true };
}

export async function sendInternalNotification(formData: FormData) {
  const actor = await requireAuth("ADMIN");
  const userId = value(formData, "userId");
  const title = value(formData, "title");
  const message = value(formData, "message");
  const href = value(formData, "href") || null;
  const rawType = value(formData, "notificationType");
  const allowedTypes = new Set(["INFO", "SUCCESS", "WARNING", "ACTION_REQUIRED"]);
  if (!userId || !title || !message) return { error: "Penerima, judul, dan pesan wajib diisi." };
  const type = (allowedTypes.has(rawType) ? rawType : "INFO") as NotificationType;

  const notification = await notifyUser({ userId, title, message, href, type });
  await logAudit({ userId: actor.id, action: "SEND_NOTIFICATION", entity: "notification", entityId: notification.id, details: { recipientUserId: userId, type } });
  revalidatePath(PATH);
  return { success: true };
}
