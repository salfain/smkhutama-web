import type { NextRequest } from "next/server";
import { ApiError, apiOk, forbidden, handle, notFound, preflight } from "@/server/http";
import { requireTeacher } from "@/server/auth";
import { findAttemptWithExam, forceSubmitAttempt } from "@/server/modules/cbt/monitoring";

/**
 * POST /api/v1/cbt/teacher/attempts/{attemptId}/force-submit
 *
 * Kumpulkan paksa pekerjaan siswa yang belum menekan submit, mis. waktu habis
 * atau perangkatnya bermasalah. Jawaban yang sudah tersimpan tetap terhitung.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ attemptId: string }> }) {
  return handle(async () => {
    const { teacher } = await requireTeacher(req);
    const { attemptId } = await ctx.params;

    const attempt = await findAttemptWithExam(attemptId);
    if (!attempt) throw notFound("Attempt tidak ditemukan", "ATTEMPT_NOT_FOUND");
    if (attempt.exam.teacherId !== teacher.id) throw forbidden();

    const result = await forceSubmitAttempt(attemptId, "TEACHER_FORCE_SUBMIT_ATTEMPT");
    if (result === "NOT_FOUND") throw notFound("Attempt tidak ditemukan", "ATTEMPT_NOT_FOUND");
    if (result === "ALREADY_SUBMITTED") {
      throw new ApiError(409, "ALREADY_SUBMITTED", "Sudah dikumpulkan");
    }

    return apiOk({ attemptId, status: "AUTO_SUBMITTED" });
  });
}

export async function OPTIONS() {
  return preflight();
}
