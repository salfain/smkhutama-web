import { prisma } from "@/lib/prisma";

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
const DAY_KEYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function getJakartaDayOfWeek(date = new Date()) {
  const key = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
  }).format(date);

  return DAY_KEYS[key] ?? date.getDay();
}

export function getPiketDayName(dayOfWeek: number) {
  return DAY_NAMES[dayOfWeek] ?? "Tidak valid";
}

export async function getActivePiketScheduleForTeacher(teacherId: string, date = new Date()) {
  return prisma.piketSchedule.findFirst({
    where: {
      teacherId,
      dayOfWeek: getJakartaDayOfWeek(date),
      isActive: true,
    },
  });
}

export async function isTeacherScheduledForPiket(teacherId: string, date = new Date()) {
  const schedule = await getActivePiketScheduleForTeacher(teacherId, date);
  return Boolean(schedule);
}
