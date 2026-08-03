/**
 * Modul Landing — pendaftaran siswa baru (PPDB).
 *
 * Dipakai formulir di halaman publik maupun `/api/v1/landing/ppdb`, sehingga
 * aturan validasinya tidak bisa berbeda antara web dan klien luar.
 */

import { prisma } from "@/lib/prisma";

export type RegistrationStatus = "PENDING" | "VERIFIED" | "ACCEPTED" | "REJECTED";

/** Berapa kali nomor pendaftaran diulang bila kebetulan bentrok. */
const MAX_NUMBER_ATTEMPTS = 10;

function generateRegistNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `PPDB-${year}-${random}`;
}

async function reserveRegistNumber(): Promise<string> {
  let candidate = generateRegistNumber();
  for (let attempt = 0; attempt < MAX_NUMBER_ATTEMPTS; attempt++) {
    const exists = await prisma.registration.findUnique({ where: { registNumber: candidate } });
    if (!exists) return candidate;
    candidate = generateRegistNumber();
  }
  return candidate;
}

export type RegistrationInput = {
  fullName: string;
  phone: string;
  selectedMajor: string;
  nisn?: string | null;
  gender?: string | null;
  birthPlace?: string | null;
  birthDate?: string | null;
  address?: string | null;
  email?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  originSchool?: string | null;
};

function normalizeGender(value?: string | null) {
  if (value === "MALE" || value === "FEMALE") return value;
  return null;
}

/**
 * Simpan pendaftaran baru dan kembalikan nomor pendaftarannya.
 * Nomor inilah yang dipakai calon siswa untuk mengecek status.
 */
export async function submitRegistration(input: RegistrationInput) {
  const registNumber = await reserveRegistNumber();

  const created = await prisma.registration.create({
    data: {
      registNumber,
      fullName: input.fullName,
      nisn: input.nisn || null,
      gender: normalizeGender(input.gender),
      birthPlace: input.birthPlace || null,
      birthDate: input.birthDate ? new Date(input.birthDate) : null,
      address: input.address || null,
      phone: input.phone || null,
      email: input.email || null,
      parentName: input.parentName || null,
      parentPhone: input.parentPhone || null,
      originSchool: input.originSchool || null,
      selectedMajor: input.selectedMajor || null,
      status: "PENDING",
    },
  });

  return created;
}

/** Status pendaftaran berdasarkan nomor; null bila nomornya tidak terdaftar. */
export async function findRegistration(registNumber: string) {
  const number = registNumber.trim();
  if (!number) return null;
  return prisma.registration.findUnique({ where: { registNumber: number } });
}
