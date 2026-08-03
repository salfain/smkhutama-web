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
