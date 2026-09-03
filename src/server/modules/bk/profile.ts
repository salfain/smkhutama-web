/**
 * Modul BK - biodata siswa pada Buku Siswa.
 *
 * Alur: siswa mengisi sendiri lewat "Biodata Saya" (status PENDING), lalu guru
 * BK memverifikasi (VERIFIED, terkunci) atau mengembalikannya (REJECTED).
 * Identitas resmi (nama, NIS, NISN) tetap milik admin dan tidak diubah di sini.
 */

import { prisma } from "@/lib/prisma";

export type ProfileInput = {
  birthPlace: string;
  birthDate: string;
  address: string;
  parentPhone: string;
  medicalHistory: string;
  photoUrl?: string | null;
};

const profileSelect = {
  id: true,
  nis: true,
  nisn: true,
  birthPlace: true,
  birthDate: true,
  address: true,
  parentPhone: true,
  medicalHistory: true,
  photoUrl: true,
  profileStatus: true,
  profileSubmittedAt: true,
  profileVerifiedAt: true,
  profileNote: true,
  user: { select: { id: true, name: true } },
  class: { select: { name: true } },
  major: { select: { name: true } },
  profileVerifiedBy: { select: { name: true } },
} as const;

export async function getProfile(studentId: string) {
  return prisma.student.findUnique({ where: { id: studentId }, select: profileSelect });
}

export async function getProfileByUserId(userId: string) {
  return prisma.student.findUnique({ where: { userId }, select: profileSelect });
}

/** Nomor HP orang tua: 08xx / +62xx, 9-15 digit. */
export function normalizePhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  const plain = digits.startsWith("+62") ? `0${digits.slice(3)}` : digits.startsWith("62") ? `0${digits.slice(2)}` : digits;
  return /^0\d{8,14}$/.test(plain) ? plain : null;
}

export function validateProfile(input: ProfileInput) {
  if (!input.birthPlace) return "Tempat lahir wajib diisi";
  if (!input.birthDate) return "Tanggal lahir wajib diisi";
  const born = new Date(input.birthDate);
  if (Number.isNaN(born.getTime())) return "Tanggal lahir tidak valid";
  if (born > new Date()) return "Tanggal lahir tidak boleh di masa depan";
  if (!input.address) return "Alamat wajib diisi";
  if (!normalizePhone(input.parentPhone)) return "Nomor orang tua tidak valid (contoh: 081234567890)";
  return null;
}

function toData(input: ProfileInput) {
  return {
    birthPlace: input.birthPlace,
    birthDate: new Date(input.birthDate),
    address: input.address,
    parentPhone: normalizePhone(input.parentPhone),
    medicalHistory: input.medicalHistory || null,
    ...(input.photoUrl ? { photoUrl: input.photoUrl } : {}),
  };
}

/** Pengisian oleh siswa - selalu masuk antrean verifikasi BK. */
export async function submitProfile(studentId: string, input: ProfileInput) {
  return prisma.student.update({
    where: { id: studentId },
    data: {
      ...toData(input),
      profileStatus: "PENDING",
      profileSubmittedAt: new Date(),
      profileNote: null,
      profileVerifiedAt: null,
      profileVerifiedById: null,
    },
  });
}

/** Pengisian oleh guru BK - langsung dianggap terverifikasi. */
export async function saveProfileByCounselor(studentId: string, counselorUserId: string, input: ProfileInput) {
  return prisma.student.update({
    where: { id: studentId },
    data: {
      ...toData(input),
      profileStatus: "VERIFIED",
      profileVerifiedAt: new Date(),
      profileVerifiedById: counselorUserId,
      profileNote: null,
    },
  });
}

export async function verifyProfile(studentId: string, counselorUserId: string) {
  return prisma.student.update({
    where: { id: studentId },
    data: {
      profileStatus: "VERIFIED",
      profileVerifiedAt: new Date(),
      profileVerifiedById: counselorUserId,
      profileNote: null,
    },
  });
}

export async function rejectProfile(studentId: string, counselorUserId: string, note: string) {
  return prisma.student.update({
    where: { id: studentId },
    data: {
      profileStatus: "REJECTED",
      profileNote: note,
      profileVerifiedAt: null,
      profileVerifiedById: counselorUserId,
    },
  });
}

export async function countPendingProfiles() {
  return prisma.student.count({ where: { profileStatus: "PENDING" } });
}

/** Bentuk JSON biodata untuk halaman web maupun `/api/v1`. */
export function toProfileDto(student: NonNullable<Awaited<ReturnType<typeof getProfile>>>) {
  return {
    studentId: student.id,
    name: student.user.name,
    className: student.class?.name ?? "-",
    major: student.major?.name ?? "-",
    nis: student.nis ?? "",
    nisn: student.nisn ?? "",
    birthPlace: student.birthPlace ?? "",
    birthDate: student.birthDate ? student.birthDate.toISOString().slice(0, 10) : "",
    address: student.address ?? "",
    parentPhone: student.parentPhone ?? "",
    medicalHistory: student.medicalHistory ?? "",
    photoUrl: student.photoUrl ?? "",
    status: student.profileStatus,
    note: student.profileNote ?? "",
    submittedAt: student.profileSubmittedAt,
    verifiedAt: student.profileVerifiedAt,
    verifiedBy: student.profileVerifiedBy?.name ?? "",
  };
}

/** Antrean verifikasi untuk guru BK. */
export async function listPendingProfiles() {
  return prisma.student.findMany({
    where: { profileStatus: "PENDING" },
    select: profileSelect,
    orderBy: { profileSubmittedAt: "asc" },
  });
}

/** Foto dilepas dari biodata; berkasnya sendiri dibiarkan di penyimpanan. */
export async function clearPhoto(studentId: string) {
  return prisma.student.update({ where: { id: studentId }, data: { photoUrl: null } });
}
