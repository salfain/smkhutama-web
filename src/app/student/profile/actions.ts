"use server";

/**
 * Server action "Biodata Saya" (siswa).
 * Siswa hanya boleh mengubah data pribadinya sendiri; identitas resmi
 * (nama, NIS, NISN) tetap dikelola admin. Data terverifikasi terkunci.
 */

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";
import { saveUploadedFile } from "@/lib/upload";
import * as profile from "@/server/modules/bk/profile";

const PROFILE_PATH = "/student/profile";
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

function text(fd: FormData, field: string) {
  return String(fd.get(field) ?? "").trim();
}

export async function getMyProfile() {
  const user = await requireAuth("STUDENT");
  if (!user.student) return null;
  return profile.getProfileByUserId(user.id);
}

export async function saveMyProfile(fd: FormData) {
  const user = await requireAuth("STUDENT");
  if (!user.student) return { error: "Data siswa tidak ditemukan" };

  const current = await profile.getProfileByUserId(user.id);
  if (!current) return { error: "Data siswa tidak ditemukan" };
  if (current.profileStatus === "VERIFIED") {
    return { error: "Biodata sudah diverifikasi BK. Hubungi guru BK untuk mengubahnya." };
  }

  const input: profile.ProfileInput = {
    birthPlace: text(fd, "birthPlace"),
    birthDate: text(fd, "birthDate"),
    address: text(fd, "address"),
    parentPhone: text(fd, "parentPhone"),
    medicalHistory: text(fd, "medicalHistory"),
  };
  const invalid = profile.validateProfile(input);
  if (invalid) return { error: invalid };

  const photo = fd.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (!PHOTO_TYPES.includes(photo.type)) return { error: "Foto harus JPG, PNG, atau WebP" };
    if (photo.size > MAX_PHOTO_BYTES) return { error: "Ukuran foto maksimal 2 MB" };
    input.photoUrl = await saveUploadedFile(photo, "students", current.id);
  }

  await profile.submitProfile(current.id, input);
  revalidatePath(PROFILE_PATH);
  return { success: "Biodata terkirim. Menunggu verifikasi guru BK." };
}
