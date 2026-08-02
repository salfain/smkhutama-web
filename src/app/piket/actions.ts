"use server";

/**
 * Server action halaman piket.
 *
 * Query-nya sekarang dipinjam dari `@/server/modules/piket/service` — sumber
 * yang sama dengan route API — sehingga tidak ada lagi dua salinan query yang
 * bisa berbeda diam-diam. File ini menyisakan urusan yang memang milik web:
 * cek sesi cookie, parsing FormData, dan `revalidatePath`.
 */

import { revalidatePath } from "next/cache";
import { requirePiketAuth } from "@/lib/session";
import * as piket from "@/server/modules/piket/service";

const DASHBOARD_PATH = "/piket/dashboard";

function text(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export async function getDashboardSummary() {
  await requirePiketAuth();
  return piket.getDashboard();
}

// ─── Keterlambatan ──────────────────────────────────────────────────────────

export async function getTardinessData(date?: string) {
  await requirePiketAuth();
  return piket.listTardiness(date);
}

export async function createTardiness(formData: FormData) {
  const user = await requirePiketAuth();
  const studentId = text(formData, "studentId");
  if (!studentId) return { error: "Siswa wajib dipilih" };

  await piket.createTardiness({
    studentId,
    recordedBy: user.id,
    reason: text(formData, "reason"),
    sanction: text(formData, "sanction"),
    // Input[type=time] mengirim "HH:mm"; service yang menggabungkannya dengan tanggal.
    arrivalTime: text(formData, "arrivalTime"),
  });

  revalidatePath("/piket/terlambat");
  revalidatePath(DASHBOARD_PATH);
  return { success: true };
}

export async function deleteTardiness(id: string) {
  await requirePiketAuth();
  await piket.deleteTardiness(id);
  revalidatePath("/piket/terlambat");
  revalidatePath(DASHBOARD_PATH);
  return { success: true };
}

// ─── Izin Keluar/Masuk ───────────────────────────────────────────────────────

export async function getPermitData(date?: string) {
  await requirePiketAuth();
  return piket.listPermits(date);
}

export async function createPermit(formData: FormData) {
  const user = await requirePiketAuth();
  const studentId = text(formData, "studentId");
  const reason = text(formData, "reason");
  if (!studentId || !reason) return { error: "Siswa dan alasan wajib diisi" };

  await piket.createPermit({ studentId, reason, recordedBy: user.id });

  revalidatePath("/piket/izin");
  revalidatePath(DASHBOARD_PATH);
  return { success: true };
}

export async function markPermitReturned(id: string) {
  await requirePiketAuth();
  await piket.markPermitReturned(id);
  revalidatePath("/piket/izin");
  revalidatePath(DASHBOARD_PATH);
  return { success: true };
}

export async function deletePermit(id: string) {
  await requirePiketAuth();
  await piket.deletePermit(id);
  revalidatePath("/piket/izin");
  revalidatePath(DASHBOARD_PATH);
  return { success: true };
}

// ─── Kehadiran Guru ──────────────────────────────────────────────────────────

export async function getAttendanceData(date?: string) {
  await requirePiketAuth();
  return piket.listAttendance(date);
}

export async function createAttendance(formData: FormData) {
  const user = await requirePiketAuth();
  const teacherId = text(formData, "teacherId");
  const classId = text(formData, "classId");
  if (!teacherId || !classId) return { error: "Guru dan kelas wajib dipilih" };

  await piket.createAttendance({
    teacherId,
    classId,
    recordedBy: user.id,
    status: text(formData, "status") || "HADIR",
    period: text(formData, "period"),
    substitute: text(formData, "substitute"),
    note: text(formData, "note"),
  });

  revalidatePath("/piket/guru");
  revalidatePath(DASHBOARD_PATH);
  return { success: true };
}

export async function deleteAttendance(id: string) {
  await requirePiketAuth();
  await piket.deleteAttendance(id);
  revalidatePath("/piket/guru");
  revalidatePath(DASHBOARD_PATH);
  return { success: true };
}
