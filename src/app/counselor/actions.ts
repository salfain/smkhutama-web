"use server";

/**
 * Server action halaman guru BK - sesi konseling, pelanggaran, prestasi,
 * dan permohonan.
 *
 * Query-nya dipinjam dari `@/server/modules/bk/service`, sumber yang sama
 * dengan route API. File ini hanya mengurus hal yang memang milik web:
 * cek sesi cookie, parsing FormData, dan `revalidatePath`.
 */

import { revalidatePath } from "next/cache";
import { requireAuth, requireCounselorAuth } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { logSensitiveAccess } from "@/lib/sensitive-access";
import * as bk from "@/server/modules/bk/service";
import { getPriorityQueue } from "@/server/modules/bk/case-workspace";
import { toAchievement, toCase, toDashboard, toRequest, toViolation } from "@/server/modules/bk/dto";

const CASES_PATH = "/counselor/cases";
const DASHBOARD_PATH = "/counselor/dashboard";
const VIOLATIONS_PATH = "/counselor/violations";
const ACHIEVEMENTS_PATH = "/counselor/achievements";
const ADMIN_VIOLATIONS_PATH = "/admin/violations";
const ADMIN_ACHIEVEMENTS_PATH = "/admin/achievements";
const REQUESTS_PATH = "/counselor/requests";

function text(fd: FormData, field: string) {
  return String(fd.get(field) ?? "").trim();
}

function intValue(fd: FormData, field: string) {
  return parseInt(String(fd.get(field) ?? "0"), 10) || 0;
}

/** Pastikan ada record Counselor untuk user yang sedang login. */
async function currentCounselorId(): Promise<string> {
  const user = await requireCounselorAuth();
  return bk.ensureCounselorId(user.id);
}

export async function listStudents() {
  await requireCounselorAuth();
  const students = await bk.listStudents();
  return students.map((s) => ({
    id: s.id,
    name: s.user.name,
    nis: s.nis ?? "",
    className: s.class?.name ?? "-",
  }));
}

// ---------- DASHBOARD ----------
export async function getDashboardStats() {
  await requireCounselorAuth();
  const [dashboard, topStudents, priorityCases] = await Promise.all([
    bk.getCounselorDashboard(),
    bk.getTopViolationStudents(),
    getPriorityQueue(),
  ]);
  return {
    ...toDashboard(dashboard),
    topStudents,
    priorityCases: priorityCases.map((record) => ({
      id: record.id,
      title: record.title,
      studentName: record.student.user.name,
      className: record.student.class?.name ?? "-",
      priority: record.priority,
      riskLevel: record.riskLevel,
      nextFollowUpAt: record.nextFollowUpAt,
      sessionCount: record._count.sessions,
    })),
  };
}

// ---------- CASES ----------
export async function listCases() {
  await requireCounselorAuth();
  const user = await requirePermission("bk.sensitive.view");
  const cases = await bk.listCases();
  await logSensitiveAccess({ userId: user.id, resourceType: "counseling_case", purpose: "Membuka daftar sesi konseling" });
  return cases.map((c) => ({ ...toCase(c), studentId: c.studentId }));
}

export async function saveCase(fd: FormData) {
  const counselorId = await currentCounselorId();
  const studentId = text(fd, "studentId");
  const title = text(fd, "title");
  if (!studentId || !title) return { error: "Siswa dan judul wajib diisi" };

  try {
    await bk.saveCase({
      id: text(fd, "id"),
      studentId,
      counselorId,
      type: text(fd, "type") as bk.CounselingType || "PRIBADI",
      status: text(fd, "status") as bk.CounselingStatus || "OPEN",
      title,
      description: text(fd, "description"),
      notes: text(fd, "notes"),
      followUp: text(fd, "followUp"),
      isConfidential: fd.get("isConfidential") === "on",
      sessionDate: text(fd, "sessionDate"),
    });
    revalidatePath(CASES_PATH);
    revalidatePath(DASHBOARD_PATH);
    return { success: true };
  } catch {
    return { error: "Gagal menyimpan kasus konseling" };
  }
}

export async function deleteCase(id: string) {
  await requireCounselorAuth();
  await bk.deleteCase(id);
  revalidatePath(CASES_PATH);
  revalidatePath(DASHBOARD_PATH);
  return { success: true };
}

// ---------- VIOLATION TYPES (master) ----------
export async function listViolationTypes() {
  await requireCounselorAuth();
  return bk.listViolationTypes();
}

export async function saveViolationType(fd: FormData) {
  await requireCounselorAuth();
  const name = text(fd, "name");
  if (!name) return { error: "Nama pelanggaran wajib diisi" };

  await bk.saveViolationType({
    id: text(fd, "id"),
    name,
    category: (text(fd, "category") as bk.ViolationCategory) || "RINGAN",
    points: intValue(fd, "points"),
  });
  revalidatePath(VIOLATIONS_PATH);
  return { success: true };
}

export async function deleteViolationType(id: string) {
  await requireCounselorAuth();
  await bk.deleteViolationType(id);
  revalidatePath(VIOLATIONS_PATH);
  return { success: true };
}

// ---------- VIOLATION RECORDS ----------
export async function listViolations() {
  await requireCounselorAuth();
  const rows = await bk.listViolations();
  return rows.map((r) => ({ ...toViolation(r), studentId: r.studentId }));
}

export async function saveViolation(fd: FormData) {
  // Guru BK ikut mencatat pelanggaran, tidak lagi khusus Kesiswaan.
  const user = await requireAuth("KESISWAAN", "COUNSELOR", "ADMIN");
  const studentId = text(fd, "studentId");
  const description = text(fd, "description");
  if (!studentId || !description) return { error: "Siswa dan deskripsi wajib diisi" };

  try {
    await bk.saveViolation({
      id: text(fd, "id"),
      studentId,
      recordedById: user.id,
      violationTypeId: text(fd, "violationTypeId"),
      description,
      points: intValue(fd, "points"),
      sanction: text(fd, "sanction"),
      date: text(fd, "date"),
    });
    revalidatePath(VIOLATIONS_PATH);
    revalidatePath(ADMIN_VIOLATIONS_PATH);
    revalidatePath(DASHBOARD_PATH);
    return { success: true };
  } catch {
    return { error: "Gagal menyimpan pelanggaran" };
  }
}

export async function deleteViolation(id: string) {
  await requireAuth("KESISWAAN", "COUNSELOR", "ADMIN");
  await bk.deleteViolation(id);
  revalidatePath(VIOLATIONS_PATH);
  revalidatePath(ADMIN_VIOLATIONS_PATH);
  revalidatePath(DASHBOARD_PATH);
  return { success: true };
}

// ---------- ACHIEVEMENT RECORDS ----------
export async function listAchievements() {
  await requireCounselorAuth();
  const rows = await bk.listAchievements();
  return rows.map((r) => ({ ...toAchievement(r), studentId: r.studentId }));
}

export async function saveAchievement(fd: FormData) {
  const user = await requireAuth("KESISWAAN");
  const studentId = text(fd, "studentId");
  const title = text(fd, "title");
  if (!studentId || !title) return { error: "Siswa dan judul prestasi wajib diisi" };

  try {
    await bk.saveAchievement({
      id: text(fd, "id"),
      studentId,
      recordedById: user.id,
      title,
      description: text(fd, "description"),
      points: intValue(fd, "points"),
      level: text(fd, "level"),
      date: text(fd, "date"),
    });
    revalidatePath(ACHIEVEMENTS_PATH);
    revalidatePath(ADMIN_ACHIEVEMENTS_PATH);
    revalidatePath(DASHBOARD_PATH);
    return { success: true };
  } catch {
    return { error: "Gagal menyimpan prestasi" };
  }
}

export async function deleteAchievement(id: string) {
  await requireAuth("KESISWAAN");
  await bk.deleteAchievement(id);
  revalidatePath(ACHIEVEMENTS_PATH);
  revalidatePath(ADMIN_ACHIEVEMENTS_PATH);
  revalidatePath(DASHBOARD_PATH);
  return { success: true };
}

// ---------- COUNSELING REQUESTS (dari siswa) ----------
export async function listRequests() {
  await requireCounselorAuth();
  const rows = await bk.listRequests();
  return rows.map(toRequest);
}

export async function respondRequest(fd: FormData) {
  await requireCounselorAuth();
  const id = text(fd, "id");
  if (!id) return { error: "Permohonan tidak ditemukan" };

  await bk.respondRequest(
    id,
    (text(fd, "status") as bk.RequestStatus) || "PENDING",
    text(fd, "response")
  );
  revalidatePath(REQUESTS_PATH);
  revalidatePath(DASHBOARD_PATH);
  return { success: true };
}

/** Terima permohonan & langsung buat sesi konseling dari datanya. */
export async function convertRequestToCase(id: string) {
  const counselorId = await currentCounselorId();
  const createdCase = await bk.convertRequestToCase(id, counselorId);
  if (!createdCase) return { error: "Permohonan tidak ditemukan" };

  revalidatePath(REQUESTS_PATH);
  revalidatePath(CASES_PATH);
  revalidatePath(DASHBOARD_PATH);
  revalidatePath("/student/bk");
  return { success: true };
}

/** Ambil detail sesi konseling untuk cetak/PDF. */
export async function getCaseDetail(id: string) {
  await requireCounselorAuth();
  const user = await requirePermission("bk.sensitive.print");
  const c = await bk.getCase(id);
  if (!c) return null;

  await logSensitiveAccess({ userId: user.id, action: "PRINT", resourceType: "counseling_case", resourceId: id, purpose: "Membuka dokumen cetak sesi konseling" });

  return {
    id: c.id,
    title: c.title,
    type: c.type,
    status: c.status,
    description: c.description ?? "",
    notes: c.notes ?? "",
    followUp: c.followUp ?? "",
    isConfidential: c.isConfidential,
    sessionDate: c.sessionDate,
    studentName: c.student.user.name,
    studentNis: c.student.nis ?? "",
    className: c.student.class?.name ?? "-",
    counselorName: c.counselor.user.name,
  };
}
