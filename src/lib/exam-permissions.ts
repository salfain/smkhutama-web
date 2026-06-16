/**
 * Aturan siapa yang bisa generate token berdasarkan jenis ujian:
 * - UH, TRYOUT, LAINNYA → Guru & Admin
 * - UTS, UAS, US → Hanya Admin
 */

const ADMIN_ONLY_EXAM_TYPES = ["UTS", "UAS", "US"];

export function canTeacherCreateToken(examType: string): boolean {
  return !ADMIN_ONLY_EXAM_TYPES.includes(examType);
}

export function getTokenPermissionLabel(examType: string): string {
  if (ADMIN_ONLY_EXAM_TYPES.includes(examType)) {
    return "Token hanya dapat dibuat oleh Admin";
  }
  return "Guru dapat membuat token sendiri";
}
