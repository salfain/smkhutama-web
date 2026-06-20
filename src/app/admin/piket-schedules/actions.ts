"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { getPiketDayName } from "@/lib/piket-schedule";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function getPiketScheduleData() {
  await requireAuth("ADMIN");

  const [teachers, schedules] = await Promise.all([
    prisma.teacher.findMany({
      where: { user: { isActive: true } },
      select: {
        id: true,
        nip: true,
        user: { select: { name: true, username: true } },
        subject: { select: { code: true, name: true } },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.piketSchedule.findMany({
      select: {
        id: true,
        teacherId: true,
        dayOfWeek: true,
        isActive: true,
        note: true,
        teacher: {
          select: {
            id: true,
            nip: true,
            user: { select: { name: true, username: true } },
            subject: { select: { code: true, name: true } },
          },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return { teachers, schedules };
}

export async function savePiketSchedule(formData: FormData) {
  const user = await requireAuth("ADMIN");
  const teacherId = String(formData.get("teacherId") ?? "").trim();
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const note = String(formData.get("note") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!teacherId) return { error: "Guru wajib dipilih" };
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    return { error: "Hari piket tidak valid" };
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { user: { select: { name: true } } },
  });
  if (!teacher) return { error: "Guru tidak ditemukan" };

  const saved = await prisma.piketSchedule.upsert({
    where: { teacherId_dayOfWeek: { teacherId, dayOfWeek } },
    create: {
      teacherId,
      dayOfWeek,
      isActive,
      note: note || null,
    },
    update: {
      isActive,
      note: note || null,
    },
  });

  await logAudit({
    userId: user.id,
    action: "UPSERT_PIKET_SCHEDULE",
    entity: "piket_schedule",
    entityId: saved.id,
    details: {
      teacherId,
      teacherName: teacher.user.name,
      dayOfWeek,
      dayName: getPiketDayName(dayOfWeek),
      isActive,
    },
  });
  revalidatePath("/admin/piket-schedules");
  return { success: true };
}

export async function deletePiketSchedule(id: string) {
  const user = await requireAuth("ADMIN");
  const schedule = await prisma.piketSchedule.findUnique({
    where: { id },
    include: { teacher: { include: { user: { select: { name: true } } } } },
  });
  if (!schedule) return { error: "Jadwal tidak ditemukan" };

  await prisma.piketSchedule.delete({ where: { id } });
  await logAudit({
    userId: user.id,
    action: "DELETE_PIKET_SCHEDULE",
    entity: "piket_schedule",
    entityId: id,
    details: {
      teacherId: schedule.teacherId,
      teacherName: schedule.teacher.user.name,
      dayOfWeek: schedule.dayOfWeek,
      dayName: getPiketDayName(schedule.dayOfWeek),
    },
  });
  revalidatePath("/admin/piket-schedules");
  return { success: true };
}
