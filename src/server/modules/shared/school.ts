/**
 * Profil sekolah — identitas yang muncul di kop semua dokumen cetak.
 *
 * Lintas modul: dipakai cetak naskah soal (CBT), surat pemanggilan dan
 * laporan konseling (BK), serta surat izin siswa (piket).
 */

import { prisma } from "@/lib/prisma";

export async function getSchoolProfile() {
  return prisma.schoolProfile.findFirst().catch(() => null);
}
