"use server";

/**
 * Server action halaman guru BK - buku siswa, kunjungan rumah, dan agenda.
 * Query-nya dipinjam dari modul BK di `@/server/modules/bk`.
 */

import { revalidatePath } from "next/cache";
import { requireCounselorAuth } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { logSensitiveAccess } from "@/lib/sensitive-access";
import * as bk from "@/server/modules/bk/service";
import * as followUp from "@/server/modules/bk/follow-up";
import * as profile from "@/server/modules/bk/profile";
import { toStudentBook, toStudentWithPoints } from "@/server/modules/bk/dto";

const HOME_VISITS_PATH = "/counselor/home-visits";

function text(fd: FormData, field: string) {
  return String(fd.get(field) ?? "").trim();
}

async function currentCounselorId(): Promise<string> {
  const user = await requireCounselorAuth();
  return bk.ensureCounselorId(user.id);
}

// ============= BUKU SISWA =============
export async function listStudentsWithPoints() {
  await requireCounselorAuth();
  const students = await bk.listStudentsWithPoints();
  return students.map(toStudentWithPoints);
}

export async function getStudentBook(studentId: string) {
  await requireCounselorAuth();
  const user = await requirePermission("bk.sensitive.view");
  const student = await bk.getStudentBook(studentId);
  if (!student) return null;
  await logSensitiveAccess({ userId: user.id, resourceType: "student_bk_book", resourceId: studentId, purpose: "Membuka buku siswa BK" });
  return toStudentBook(student);
}

// ============= BIODATA SISWA =============
/**
 * Verifikasi/koreksi biodata yang dikirim siswa. Guru BK boleh mengedit
 * langsung untuk siswa yang tidak kunjung mengisi sendiri.
 */
export async function verifyStudentProfile(fd: FormData) {
  await requireCounselorAuth();
  const user = await requirePermission("bk.sensitive.view");
  const studentId = text(fd, "studentId");
  if (!studentId) return { error: "Siswa tidak valid" };

  await profile.verifyProfile(studentId, user.id);
  revalidatePath(`/counselor/students/${studentId}`);
  return { success: "Biodata diverifikasi" };
}

export async function rejectStudentProfile(fd: FormData) {
  await requireCounselorAuth();
  const user = await requirePermission("bk.sensitive.view");
  const studentId = text(fd, "studentId");
  const note = text(fd, "note");
  if (!studentId) return { error: "Siswa tidak valid" };
  if (!note) return { error: "Catatan perbaikan wajib diisi" };

  await profile.rejectProfile(studentId, user.id, note);
  revalidatePath(`/counselor/students/${studentId}`);
  return { success: "Biodata dikembalikan ke siswa" };
}

export async function saveStudentProfile(fd: FormData) {
  await requireCounselorAuth();
  const user = await requirePermission("bk.sensitive.view");
  const studentId = text(fd, "studentId");
  if (!studentId) return { error: "Siswa tidak valid" };

  const input: profile.ProfileInput = {
    birthPlace: text(fd, "birthPlace"),
    birthDate: text(fd, "birthDate"),
    address: text(fd, "address"),
    parentPhone: text(fd, "parentPhone"),
    medicalHistory: text(fd, "medicalHistory"),
  };
  const invalid = profile.validateProfile(input);
  if (invalid) return { error: invalid };

  await profile.saveProfileByCounselor(studentId, user.id, input);
  revalidatePath(`/counselor/students/${studentId}`);
  return { success: "Biodata tersimpan & terverifikasi" };
}

// ============= KUNJUNGAN RUMAH =============
export async function listHomeVisits() {
  await requireCounselorAuth();
  const rows = await followUp.listHomeVisits();
  return rows.map((h) => ({
    id: h.id,
    studentId: h.studentId,
    studentName: h.student.user.name,
    className: h.student.class?.name ?? "-",
    visitDate: h.visitDate,
    purpose: h.purpose,
    address: h.address ?? "",
    findings: h.findings ?? "",
    result: h.result ?? "",
  }));
}

export async function saveHomeVisit(fd: FormData) {
  const counselorId = await currentCounselorId();
  const studentId = text(fd, "studentId");
  const purpose = text(fd, "purpose");
  if (!studentId || !purpose) return { error: "Siswa dan tujuan wajib diisi" };

  await followUp.saveHomeVisit({
    id: text(fd, "id"),
    studentId,
    counselorId,
    visitDate: text(fd, "visitDate"),
    purpose,
    address: text(fd, "address"),
    findings: text(fd, "findings"),
    result: text(fd, "result"),
  });

  revalidatePath(HOME_VISITS_PATH);
  return { success: true };
}

export async function deleteHomeVisit(id: string) {
  await requireCounselorAuth();
  await followUp.deleteHomeVisit(id);
  revalidatePath(HOME_VISITS_PATH);
  return { success: true };
}

export async function getHomeVisitDetail(id: string) {
  await requireCounselorAuth();
  const user = await requirePermission("bk.sensitive.print");
  const h = await followUp.getHomeVisit(id);
  if (!h) return null;

  await logSensitiveAccess({ userId: user.id, action: "PRINT", resourceType: "home_visit", resourceId: id, purpose: "Membuka dokumen cetak kunjungan rumah" });

  return {
    id: h.id,
    visitDate: h.visitDate,
    purpose: h.purpose,
    address: h.address ?? "",
    findings: h.findings ?? "",
    result: h.result ?? "",
    studentName: h.student.user.name,
    studentNis: h.student.nis ?? "",
    className: h.student.class?.name ?? "-",
    counselorName: h.counselor.user.name,
  };
}

// ============= AGENDA =============
export async function getAgenda() {
  await requireCounselorAuth();
  return followUp.getAgenda();
}
