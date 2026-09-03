/**
 * Modul Piket - lapisan service.
 *
 * Satu-satunya tempat query Prisma untuk guru piket. Dipakai bersama oleh:
 *   - route API v1  : `src/app/api/v1/piket/**`
 *   - route API lama: `src/app/api/piket/**` (bentuk response dipertahankan)
 *   - server action : `src/app/piket/actions.ts` (halaman web)
 *
 * Service ini tidak tahu-menahu soal HTTP, cookie, atau `revalidatePath` -
 * urusan itu tetap di route handler dan server action masing-masing.
 */

import { prisma } from "@/lib/prisma";
import { requireCurrentAcademicYearId } from "@/lib/academic-year";
import { dayRange, isDateOnly, todayDateOnly } from "@/server/date-range";

// ─── Bentuk include yang dipakai ulang ──────────────────────────────────────

const STUDENT_WITH_CLASS = {
  user: { select: { name: true } },
  class: { select: { name: true } },
  major: { select: { name: true } },
} as const;

const STUDENT_OPTION_INCLUDE = {
  user: { select: { name: true } },
  class: { select: { name: true } },
} as const;

// ─── Dashboard ──────────────────────────────────────────────────────────────

/** Ringkasan piket satu hari: hitungan + daftar siswa yang belum kembali. */
export async function getDashboard(date?: string | null) {
  const { start, end } = dayRange(date);

  const [tardiness, permits, absences, activePermits] = await Promise.all([
    prisma.studentTardiness.count({ where: { date: { gte: start, lte: end } } }),
    prisma.studentPermit.count({ where: { date: { gte: start, lte: end }, status: "KELUAR" } }),
    prisma.teacherAttendance.count({
      where: { date: { gte: start, lte: end }, status: { not: "HADIR" } },
    }),
    prisma.studentPermit.findMany({
      where: { date: { gte: start, lte: end }, status: "KELUAR" },
      include: { student: { include: STUDENT_WITH_CLASS } },
      orderBy: { exitTime: "asc" },
      take: 10,
    }),
  ]);

  return { tardiness, permits, absences, activePermits };
}

// ─── Pilihan siswa/guru/kelas untuk form ────────────────────────────────────

export async function listStudentOptions() {
  return prisma.student.findMany({
    include: STUDENT_OPTION_INCLUDE,
    orderBy: { user: { name: "asc" } },
  });
}

export async function listTeacherOptions() {
  return prisma.teacher.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });
}

export async function listClassOptions() {
  return prisma.class.findMany({ orderBy: [{ grade: "asc" }, { name: "asc" }] });
}

// ─── Keterlambatan siswa ────────────────────────────────────────────────────

export async function listTardiness(date?: string | null) {
  const { start, end } = dayRange(date);

  const [records, students] = await Promise.all([
    prisma.studentTardiness.findMany({
      where: { date: { gte: start, lte: end } },
      include: { student: { include: STUDENT_WITH_CLASS } },
      orderBy: { createdAt: "desc" },
    }),
    listStudentOptions(),
  ]);

  return { records, students };
}

export type CreateTardinessInput = {
  studentId: string;
  recordedBy: string;
  reason?: string | null;
  sanction?: string | null;
  /** "HH:mm" atau ISO string. Kosong = waktu sekarang. */
  arrivalTime?: string | null;
  /** "YYYY-MM-DD". Kosong = hari ini. */
  date?: string | null;
};

export async function createTardiness(input: CreateTardinessInput) {
  const academicYearId = await requireCurrentAcademicYearId();
  const dateOnly = isDateOnly(input.date) ? input.date : todayDateOnly();
  const recordDate = new Date(`${dateOnly}T00:00:00`);

  let arrivalTime: Date;
  const rawArrival = input.arrivalTime ? String(input.arrivalTime) : "";
  if (/^\d{2}:\d{2}$/.test(rawArrival)) {
    arrivalTime = new Date(`${dateOnly}T${rawArrival}:00`);
  } else if (rawArrival) {
    arrivalTime = new Date(rawArrival);
  } else {
    arrivalTime = new Date();
  }
  if (Number.isNaN(arrivalTime.getTime())) arrivalTime = new Date();

  return prisma.studentTardiness.create({
    data: {
      studentId: input.studentId,
      academicYearId,
      recordedBy: input.recordedBy,
      arrivalTime,
      date: recordDate,
      reason: input.reason || null,
      sanction: input.sanction || null,
    },
  });
}

export async function deleteTardiness(id: string) {
  const result = await prisma.studentTardiness.deleteMany({ where: { id } });
  return result.count > 0;
}

// ─── Izin keluar siswa ──────────────────────────────────────────────────────

export async function listPermits(date?: string | null) {
  const { start, end } = dayRange(date);

  const [records, students] = await Promise.all([
    prisma.studentPermit.findMany({
      where: { date: { gte: start, lte: end } },
      include: { student: { include: STUDENT_WITH_CLASS } },
      orderBy: { createdAt: "desc" },
    }),
    listStudentOptions(),
  ]);

  return { records, students };
}

export type CreatePermitInput = {
  studentId: string;
  recordedBy: string;
  reason: string;
};

export async function createPermit(input: CreatePermitInput) {
  const academicYearId = await requireCurrentAcademicYearId();
  return prisma.studentPermit.create({
    data: {
      studentId: input.studentId,
      academicYearId,
      recordedBy: input.recordedBy,
      type: "KELUAR",
      reason: input.reason,
      exitTime: new Date(),
      status: "KELUAR",
    },
  });
}

/**
 * Satu catatan izin beserta identitas siswa dan nama petugas piket yang
 * mencatatnya - untuk surat izin keluar yang dicetak.
 */
export async function getPermitForPrint(id: string) {
  const permit = await prisma.studentPermit.findUnique({
    where: { id },
    include: { student: { include: STUDENT_WITH_CLASS } },
  });
  if (!permit) return null;

  const recorder = await prisma.user
    .findUnique({ where: { id: permit.recordedBy }, select: { name: true } })
    .catch(() => null);

  return { permit, recorderName: recorder?.name ?? null };
}

/** Tandai siswa sudah kembali. False kalau catatannya tidak ada. */
export async function markPermitReturned(id: string) {
  const result = await prisma.studentPermit.updateMany({
    where: { id },
    data: { status: "SUDAH_KEMBALI", returnTime: new Date() },
  });
  return result.count > 0;
}

export async function deletePermit(id: string) {
  const result = await prisma.studentPermit.deleteMany({ where: { id } });
  return result.count > 0;
}

// ─── Kehadiran guru di kelas ────────────────────────────────────────────────

export async function listAttendance(date?: string | null) {
  const { start, end } = dayRange(date);

  const [records, teachers, classes] = await Promise.all([
    prisma.teacherAttendance.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        class: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    listTeacherOptions(),
    listClassOptions(),
  ]);

  return { records, teachers, classes };
}

export type CreateAttendanceInput = {
  teacherId: string;
  classId: string;
  recordedBy: string;
  status?: string | null;
  period?: string | null;
  substitute?: string | null;
  note?: string | null;
  /** "YYYY-MM-DD". Kosong = waktu sekarang. */
  date?: string | null;
};

export async function createAttendance(input: CreateAttendanceInput) {
  const academicYearId = await requireCurrentAcademicYearId();
  const recordDate = isDateOnly(input.date) ? new Date(`${input.date}T00:00:00`) : new Date();

  return prisma.teacherAttendance.create({
    data: {
      teacherId: input.teacherId,
      academicYearId,
      classId: input.classId,
      recordedBy: input.recordedBy,
      status: input.status || "HADIR",
      date: recordDate,
      period: input.period || null,
      substitute: input.substitute || null,
      note: input.note || null,
    },
  });
}

export async function deleteAttendance(id: string) {
  const result = await prisma.teacherAttendance.deleteMany({ where: { id } });
  return result.count > 0;
}
