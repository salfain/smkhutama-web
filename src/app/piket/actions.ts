"use server";

import { prisma } from "@/lib/prisma";
import { requirePiketAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";

// ─── Helpers ────────────────────────────────────────────────────────────────

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export async function getDashboardSummary() {
  const user = await requirePiketAuth();
  const { start, end } = todayRange();

  const [tardiness, permits, absences] = await Promise.all([
    prisma.studentTardiness.count({ where: { date: { gte: start, lte: end } } }),
    prisma.studentPermit.count({ where: { date: { gte: start, lte: end }, status: "KELUAR" } }),
    prisma.teacherAttendance.count({ where: { date: { gte: start, lte: end }, status: { not: "HADIR" } } }),
  ]);

  const activePermits = await prisma.studentPermit.findMany({
    where: { date: { gte: start, lte: end }, status: "KELUAR" },
    include: { student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } } },
    orderBy: { exitTime: "asc" },
    take: 10,
  });

  void user;
  return { tardiness, permits, absences, activePermits };
}

// ─── Keterlambatan ──────────────────────────────────────────────────────────

export async function getTardinessData(date?: string) {
  await requirePiketAuth();
  const d = date ? new Date(date) : new Date();
  const start = new Date(d); start.setHours(0, 0, 0, 0);
  const end = new Date(d); end.setHours(23, 59, 59, 999);

  const [records, students] = await Promise.all([
    prisma.studentTardiness.findMany({
      where: { date: { gte: start, lte: end } },
      include: { student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.student.findMany({
      include: { user: { select: { name: true } }, class: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);
  return { records, students };
}

export async function createTardiness(formData: FormData) {
  const user = await requirePiketAuth();
  const studentId = String(formData.get("studentId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const sanction = String(formData.get("sanction") ?? "").trim();
  const arrivalStr = String(formData.get("arrivalTime") ?? "").trim();

  if (!studentId) return { error: "Siswa wajib dipilih" };

  const arrivalTime = arrivalStr ? new Date(arrivalStr) : new Date();

  await prisma.studentTardiness.create({
    data: {
      studentId,
      recordedBy: user.id,
      arrivalTime,
      reason: reason || null,
      sanction: sanction || null,
    },
  });
  revalidatePath("/piket/terlambat");
  revalidatePath("/piket/dashboard");
  return { success: true };
}

export async function deleteTardiness(id: string) {
  await requirePiketAuth();
  await prisma.studentTardiness.delete({ where: { id } });
  revalidatePath("/piket/terlambat");
  revalidatePath("/piket/dashboard");
  return { success: true };
}

// ─── Izin Keluar/Masuk ───────────────────────────────────────────────────────

export async function getPermitData(date?: string) {
  await requirePiketAuth();
  const d = date ? new Date(date) : new Date();
  const start = new Date(d); start.setHours(0, 0, 0, 0);
  const end = new Date(d); end.setHours(23, 59, 59, 999);

  const [records, students] = await Promise.all([
    prisma.studentPermit.findMany({
      where: { date: { gte: start, lte: end } },
      include: { student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.student.findMany({
      include: { user: { select: { name: true } }, class: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);
  return { records, students };
}

export async function createPermit(formData: FormData) {
  const user = await requirePiketAuth();
  const studentId = String(formData.get("studentId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!studentId || !reason) return { error: "Siswa dan alasan wajib diisi" };

  await prisma.studentPermit.create({
    data: {
      studentId,
      recordedBy: user.id,
      type: "KELUAR",
      reason,
      exitTime: new Date(),
      status: "KELUAR",
    },
  });
  revalidatePath("/piket/izin");
  revalidatePath("/piket/dashboard");
  return { success: true };
}

export async function markPermitReturned(id: string) {
  await requirePiketAuth();
  await prisma.studentPermit.update({
    where: { id },
    data: { status: "SUDAH_KEMBALI", returnTime: new Date() },
  });
  revalidatePath("/piket/izin");
  revalidatePath("/piket/dashboard");
  return { success: true };
}

export async function deletePermit(id: string) {
  await requirePiketAuth();
  await prisma.studentPermit.delete({ where: { id } });
  revalidatePath("/piket/izin");
  revalidatePath("/piket/dashboard");
  return { success: true };
}

// ─── Kehadiran Guru ──────────────────────────────────────────────────────────

export async function getAttendanceData(date?: string) {
  await requirePiketAuth();
  const d = date ? new Date(date) : new Date();
  const start = new Date(d); start.setHours(0, 0, 0, 0);
  const end = new Date(d); end.setHours(23, 59, 59, 999);

  const [records, teachers, classes] = await Promise.all([
    prisma.teacherAttendance.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        class: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.teacher.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.class.findMany({ orderBy: [{ grade: "asc" }, { name: "asc" }] }),
  ]);
  return { records, teachers, classes };
}

export async function createAttendance(formData: FormData) {
  const user = await requirePiketAuth();
  const teacherId = String(formData.get("teacherId") ?? "").trim();
  const classId   = String(formData.get("classId") ?? "").trim();
  const status    = String(formData.get("status") ?? "HADIR").trim();
  const period    = String(formData.get("period") ?? "").trim();
  const substitute = String(formData.get("substitute") ?? "").trim();
  const note      = String(formData.get("note") ?? "").trim();

  if (!teacherId || !classId) return { error: "Guru dan kelas wajib dipilih" };

  await prisma.teacherAttendance.create({
    data: {
      teacherId,
      classId,
      recordedBy: user.id,
      status,
      period: period || null,
      substitute: substitute || null,
      note: note || null,
    },
  });
  revalidatePath("/piket/guru");
  revalidatePath("/piket/dashboard");
  return { success: true };
}

export async function deleteAttendance(id: string) {
  await requirePiketAuth();
  await prisma.teacherAttendance.delete({ where: { id } });
  revalidatePath("/piket/guru");
  revalidatePath("/piket/dashboard");
  return { success: true };
}
