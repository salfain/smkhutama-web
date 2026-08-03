"use server";

/**
 * Server action formulir PPDB di halaman publik.
 * Penyimpanan dan pencarian pendaftarannya dipinjam dari
 * `@/server/modules/landing/ppdb`, sumber yang sama dengan API.
 */

import { findRegistration, submitRegistration as saveRegistration } from "@/server/modules/landing/ppdb";
import { toRegistrationStatus } from "@/server/modules/landing/dto";

function text(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

export async function submitRegistration(formData: FormData) {
  const fullName = text(formData, "fullName");
  const phone = text(formData, "phone");
  const selectedMajor = text(formData, "selectedMajor");

  if (!fullName || !phone || !selectedMajor) {
    return { error: "Nama, no. HP, dan pilihan jurusan wajib diisi" };
  }

  try {
    const registration = await saveRegistration({
      fullName,
      phone,
      selectedMajor,
      nisn: text(formData, "nisn"),
      gender: text(formData, "gender"),
      birthPlace: text(formData, "birthPlace"),
      birthDate: text(formData, "birthDate"),
      address: text(formData, "address"),
      email: text(formData, "email"),
      parentName: text(formData, "parentName"),
      parentPhone: text(formData, "parentPhone"),
      originSchool: text(formData, "originSchool"),
    });

    return { success: true, registNumber: registration.registNumber };
  } catch {
    return { error: "Gagal menyimpan pendaftaran. Coba lagi." };
  }
}

export async function checkRegistrationStatus(registNumber: string) {
  if (!registNumber.trim()) return { error: "Masukkan nomor pendaftaran" };

  try {
    const registration = await findRegistration(registNumber);
    if (!registration) {
      return { error: "Nomor pendaftaran tidak ditemukan. Periksa kembali." };
    }
    return { success: true as const, data: toRegistrationStatus(registration) };
  } catch {
    return { error: "Terjadi kesalahan. Coba lagi." };
  }
}
