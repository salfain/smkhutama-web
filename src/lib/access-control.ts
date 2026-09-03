export const ASSIGNMENT_OPTIONS = [
  ["KURIKULUM", "Kurikulum"],
  ["KESISWAAN", "Kesiswaan"],
  ["ADMIN_CBT", "Admin CBT"],
  ["COUNSELOR", "Guru BK"],
  ["PIKET", "Guru Piket"],
  ["HOMEROOM_TEACHER", "Wali Kelas"],
  ["STUDENT_ADVISOR", "Guru Wali"],
  ["OSIS_ADVISOR", "Pembina OSIS"],
  ["EXTRACURRICULAR_ADVISOR", "Pembina Ekstrakurikuler"],
  ["HEAD_OF_PROGRAM", "Kepala Program Keahlian"],
  ["PKL_ADVISOR", "Pembimbing PKL"],
  ["BKK", "Pengurus BKK"],
  ["LSP", "Pengurus LSP-P1"],
  ["SAFE_SCHOOL_TEAM", "Tim Sekolah Aman"],
  ["CMS", "Pengelola Konten"],
  ["PPDB", "Panitia PPDB"],
  ["LEADERSHIP", "Pimpinan Sekolah"],
  ["FACILITIES", "Sarpras/Laboratorium"],
] as const;

export type AssignmentKey = (typeof ASSIGNMENT_OPTIONS)[number][0];

export const ASSIGNMENT_LABELS = Object.fromEntries(ASSIGNMENT_OPTIONS) as Record<AssignmentKey, string>;

export const ASSIGNMENTS_REQUIRING_CLASS: readonly AssignmentKey[] = ["HOMEROOM_TEACHER", "STUDENT_ADVISOR"];
export const ASSIGNMENTS_REQUIRING_MAJOR: readonly AssignmentKey[] = ["HEAD_OF_PROGRAM"];

/**
 * Akses yang benar-benar dibuka tiap penugasan, sesuai gerbang di
 * `@/lib/session` dan `@/lib/assignment-access`. Penugasan yang tidak terdaftar
 * di sini murni catatan tanggung jawab - tidak menambah menu apa pun.
 */
const ASSIGNMENT_GRANTS: Partial<Record<AssignmentKey, string>> = {
  KURIKULUM: "Membuka menu admin Kurikulum: kelas, mata pelajaran, jadwal, dan tahun ajaran.",
  KESISWAAN: "Membuka menu admin Kesiswaan: pelanggaran, prestasi, dan rekap siswa.",
  ADMIN_CBT: "Membuka menu admin CBT: jadwal ujian, paket soal, token, dan laporan.",
  COUNSELOR: "Membuka area Bimbingan Konseling.",
  PIKET: "Membuka area Piket.",
  CMS: "Membuka area Kelola Konten (CMS).",
  HOMEROOM_TEACHER: "Menjadikan pengguna wali kelas resmi dari kelas yang dipilih.",
};

export function assignmentEffect(type: AssignmentKey) {
  return ASSIGNMENT_GRANTS[type] ?? "Hanya dicatat sebagai tanggung jawab - tidak membuka menu baru.";
}

export function assignmentGrantsAccess(type: AssignmentKey) {
  return type in ASSIGNMENT_GRANTS;
}
