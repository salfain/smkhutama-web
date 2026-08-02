"use server";

/**
 * Server action halaman laporan & tindak lanjut guru BK.
 * Query dan perhitungannya dipinjam dari `@/server/modules/bk/follow-up`.
 */

import { requireCounselorAuth } from "@/lib/session";
import { generateExcel } from "@/lib/excel";
import { ensureCounselorId } from "@/server/modules/bk/service";
import * as followUp from "@/server/modules/bk/follow-up";

function text(fd: FormData, field: string) {
  return String(fd.get(field) ?? "").trim();
}

// ============= LAPORAN & REKAP =============
export async function getReportData() {
  await requireCounselorAuth();
  return followUp.getReportData();
}

export async function exportReportExcel() {
  await requireCounselorAuth();
  const data = await followUp.getReportData();

  const rows = data.perClass.map((c, i) => ({
    no: i + 1,
    kelas: c.className,
    siswa: c.students,
    jumlahPelanggaran: c.violations,
    poinPelanggaran: c.violationPoints,
    poinPrestasi: c.achievementPoints,
    konseling: c.cases,
  }));

  const buf = await generateExcel(
    "Rekap BK per Kelas",
    [
      { header: "No", key: "no", width: 5 },
      { header: "Kelas", key: "kelas", width: 18 },
      { header: "Jml Siswa", key: "siswa", width: 10 },
      { header: "Jml Pelanggaran", key: "jumlahPelanggaran", width: 16 },
      { header: "Poin Pelanggaran", key: "poinPelanggaran", width: 16 },
      { header: "Poin Prestasi", key: "poinPrestasi", width: 14 },
      { header: "Sesi Konseling", key: "konseling", width: 14 },
    ],
    rows
  );

  return { data: Array.from(buf), filename: "rekap-bk-per-kelas.xlsx" };
}

// ============= TINDAK LANJUT (SP) =============
export async function getFollowUpData() {
  await requireCounselorAuth();
  return followUp.getFollowUpData();
}

export async function createSummon(fd: FormData) {
  const user = await requireCounselorAuth();
  const studentId = text(fd, "studentId");
  const level = text(fd, "level");
  const reason = text(fd, "reason");
  if (!studentId || !level || !reason) return { error: "Data tidak lengkap" };

  await followUp.createSummon({
    studentId,
    counselorId: await ensureCounselorId(user.id),
    level,
    reason,
    totalPoints: parseInt(text(fd, "totalPoints"), 10) || 0,
    meetingDate: text(fd, "meetingDate"),
  });

  return { success: true };
}

export async function listSummons() {
  await requireCounselorAuth();
  const rows = await followUp.listSummons();
  return rows.map((r) => ({
    id: r.id,
    studentName: r.student.user.name,
    className: r.student.class?.name ?? "-",
    studentPhone: "",
    level: r.level,
    reason: r.reason,
    totalPoints: r.totalPoints,
    meetingDate: r.meetingDate,
    status: r.status,
    createdAt: r.createdAt,
  }));
}

export async function updateSummonStatus(id: string, status: followUp.SummonStatus) {
  await requireCounselorAuth();
  await followUp.updateSummonStatus(id, status);
  return { success: true };
}

export async function deleteSummon(id: string) {
  await requireCounselorAuth();
  await followUp.deleteSummon(id);
  return { success: true };
}

export async function getSummonDetail(id: string) {
  await requireCounselorAuth();
  const s = await followUp.getSummon(id);
  if (!s) return null;

  return {
    id: s.id,
    level: s.level,
    reason: s.reason,
    totalPoints: s.totalPoints,
    meetingDate: s.meetingDate,
    createdAt: s.createdAt,
    studentName: s.student.user.name,
    studentNis: s.student.nis ?? "",
    className: s.student.class?.name ?? "-",
    counselorName: s.counselor.user.name,
  };
}
