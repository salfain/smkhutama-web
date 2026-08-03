import type { NextRequest } from "next/server";
import { apiOk, handle, preflight } from "@/server/http";
import { requireStudent } from "@/server/auth";
import { findAttempt } from "@/server/modules/cbt/exam-session";
import { attemptNotFound } from "@/server/modules/cbt/http-errors";
import { toAttemptStatus } from "@/server/modules/cbt/dto";

/**
 * GET /api/v1/cbt/student/exams/{id}/status
 *
 * Dipakai klien untuk memantau apakah attempt masih terkunci atau sudah
 * dibuka pengawas.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { student } = await requireStudent(req);
    const { id: examId } = await ctx.params;

    const attempt = await findAttempt(examId, student.id);
    if (!attempt) throw attemptNotFound();

    return apiOk(toAttemptStatus(attempt));
  });
}

export async function OPTIONS() {
  return preflight();
}
