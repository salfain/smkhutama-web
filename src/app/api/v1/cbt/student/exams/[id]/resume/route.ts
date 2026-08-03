import type { NextRequest } from "next/server";
import { apiOk, handle, notFound, preflight } from "@/server/http";
import { requireStudent } from "@/server/auth";
import { buildMobileExamPayload } from "@/lib/mobile-exam";
import { getAttemptWithAnswers, getExamWithQuestions } from "@/server/modules/cbt/exam-session";
import { toResumeWithoutAttempt } from "@/server/modules/cbt/dto";

/**
 * GET /api/v1/cbt/student/exams/{id}/resume
 *
 * Dipanggil saat aplikasi dibuka kembali setelah tertutup atau koneksi putus.
 * Berbeda dengan `/questions`, siswa yang belum memulai ujian tidak dianggap
 * error — yang dikembalikan `attempt: null` supaya klien tahu harus meminta
 * token dulu.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { student } = await requireStudent(req);
    const { id: examId } = await ctx.params;

    const [exam, attempt] = await Promise.all([
      getExamWithQuestions(examId),
      getAttemptWithAnswers(examId, student.id),
    ]);

    if (!exam) throw notFound("Ujian tidak ditemukan", "EXAM_NOT_FOUND");
    if (!attempt) return apiOk(toResumeWithoutAttempt(exam));

    return apiOk(buildMobileExamPayload(exam, attempt));
  });
}

export async function OPTIONS() {
  return preflight();
}
