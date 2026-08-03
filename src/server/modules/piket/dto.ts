/**
 * Modul Piket — pemetaan record Prisma ke bentuk JSON yang dikirim ke klien.
 *
 * Dipisah dari service supaya halaman web tetap bisa memakai record Prisma
 * apa adanya, sementara API mengirim bentuk yang datar dan stabil.
 * Bentuk di sini sengaja sama persis dengan response `/api/piket/*` yang lama
 * agar aplikasi mobile tidak perlu berubah saat pindah ke `/api/v1`.
 */

import type {
  getDashboard,
  listAttendance,
  listPermits,
  listStudentOptions,
  listTardiness,
} from "./service";

type StudentOption = Awaited<ReturnType<typeof listStudentOptions>>[number];
type TardinessRecord = Awaited<ReturnType<typeof listTardiness>>["records"][number];
type PermitRecord = Awaited<ReturnType<typeof listPermits>>["records"][number];
type AttendanceRecord = Awaited<ReturnType<typeof listAttendance>>["records"][number];
type TeacherOption = Awaited<ReturnType<typeof listAttendance>>["teachers"][number];
type ClassOption = Awaited<ReturnType<typeof listAttendance>>["classes"][number];
type DashboardResult = Awaited<ReturnType<typeof getDashboard>>;

const NO_CLASS = "—";

export function toStudentOption(student: StudentOption) {
  return {
    id: student.id,
    name: student.user.name,
    className: student.class?.name ?? NO_CLASS,
    nis: student.nis,
  };
}

export function toTeacherOption(teacher: TeacherOption) {
  return { id: teacher.id, name: teacher.user.name };
}

export function toClassOption(cls: ClassOption) {
  return { id: cls.id, name: cls.name };
}

export function toTardiness(record: TardinessRecord) {
  return {
    id: record.id,
    studentName: record.student.user.name,
    className: record.student.class?.name ?? NO_CLASS,
    arrivalTime: record.arrivalTime,
    reason: record.reason,
    sanction: record.sanction,
    date: record.date,
  };
}

export function toPermit(record: PermitRecord) {
  return {
    id: record.id,
    studentName: record.student.user.name,
    className: record.student.class?.name ?? NO_CLASS,
    major: record.student.major?.name ?? "-",
    reason: record.reason,
    exitTime: record.exitTime,
    returnTime: record.returnTime,
    status: record.status,
    date: record.date,
  };
}

export function toAttendance(record: AttendanceRecord) {
  return {
    id: record.id,
    teacherName: record.teacher.user.name,
    className: record.class.name,
    status: record.status,
    period: record.period,
    substitute: record.substitute,
    note: record.note,
    date: record.date,
  };
}

export function toDashboard(result: DashboardResult) {
  return {
    tardiness: result.tardiness,
    permits: result.permits,
    absences: result.absences,
    activePermits: result.activePermits.map((permit) => ({
      id: permit.id,
      studentName: permit.student.user.name,
      className: permit.student.class?.name ?? NO_CLASS,
      reason: permit.reason,
      exitTime: permit.exitTime,
    })),
  };
}
