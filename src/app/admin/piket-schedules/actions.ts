"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export async function getPiketScheduleData() {
  await requireAuth("ADMIN");

  const [schedules, teachers] = await Promise.all([
    prisma.piketSchedule.findMany({
      include: { teacher: { include: { user: { select: { name: true } } } } },
      orderBy: [{ dayOfWeek: "asc" }, { createdAt: "asc" }],
    }),
    prisma.teacher.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  return { schedules, teachers, dayNames: DAY_NAMES };
}

export async function upsertPiketSchedule(formData: FormData) {
  await requireAuth("ADMIN");

  const teacherId = String(formData.get("teacherId") ?? "").trim();
  const dayOfWeek = Number(formData.get("dayOfWeek") ?? -1);
  const note      = String(formData.get("note") ?? "").trim();

  if (!teacherId) return { error: "Guru wajib dipilih" };
  if (dayOfWeek < 0 || dayOfWeek > 6) return { error: "Hari tidak valid" };

  try {
    await prisma.piketSchedule.upsert({
      where: { teacherId_dayOfWeek: { teacherId, dayOfWeek } },
      update: { isActive: true, note: note || null },
      create: { teacherId, dayOfWeek, note: note || null, isActive: true },
    });
    revalidatePath("/admin/piket-schedule");
    return { success: true };
  } catch {
    return { error: "Gagal menyimpan jadwal" };
  }
}

export async function deletePiketSchedule(id: string) {
  await requireAuth("ADMIN");
  await prisma.piketSchedule.delete({ where: { id } });
  revalidatePath("/admin/piket-schedule");
  return { success: true };
}

export async function togglePiketSchedule(id: string) {
  await requireAuth("ADMIN");
  const current = await prisma.piketSchedule.findUnique({ where: { id } });
  if (!current) return { error: "Jadwal tidak ditemukan" };
  await prisma.piketSchedule.update({
    where: { id },
    data: { isActive: !current.isActive },
  });
  revalidatePath("/admin/piket-schedule");
  return { success: true };
}
