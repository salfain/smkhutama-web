"use server";

/**
 * Server action penilaian esai oleh guru.
 * Penilaian dan penghitungan ulang nilai akhir dipinjam dari
 * `@/server/modules/cbt/teacher`.
 */

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";
import { gradeEssay as gradeEssayAnswer, listEssayAnswers } from "@/server/modules/cbt/teacher";

const GRADING_PATH = "/teacher/essay-grading";

export async function getPendingEssays() {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return [];

  // Dikelompokkan per waktu pengumpulan supaya guru menilai satu berkas
  // sampai tuntas sebelum pindah ke siswa berikutnya.
  return listEssayAnswers(user.teacher.id, "SUBMITTED_DESC");
}

export async function gradeEssay(answerId: string, formData: FormData) {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return { error: "Tidak diizinkan" };

  const score = Number(formData.get("score") ?? "");
  if (Number.isNaN(score) || score < 0 || score > 100) {
    return { error: "Nilai harus 0–100" };
  }

  try {
    const result = await gradeEssayAnswer({
      answerId,
      teacherId: user.teacher.id,
      score,
      auditAction: "GRADE_ESSAY",
    });

    if (result === "NOT_FOUND") return { error: "Jawaban tidak ditemukan" };
    if (result === "FORBIDDEN") return { error: "Tidak diizinkan" };

    revalidatePath(GRADING_PATH);
    return { success: true };
  } catch {
    return { error: "Gagal menyimpan nilai" };
  }
}
