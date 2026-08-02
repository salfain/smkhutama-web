import type { NextRequest } from "next/server";
import { apiOk, boolField, handle, preflight, readJson } from "@/server/http";
import { requireStudent } from "@/server/auth";
import { submitAttempt } from "@/server/modules/cbt/exam-session";
import { attemptNotFound } from "@/server/modules/cbt/http-errors";

/**
 * POST /api/v1/cbt/student/exams/{id}/submit
 *
 * Kirim `{ auto: true }` untuk penyerahan otomatis saat waktu habis.
 * Bersifat idempoten: submit kedua mengembalikan nilai yang sama, tidak
 * menghitung ulang dan tidak menimpa apa pun.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { actor, student } = await requireStudent(req);
    const { id: examId } = await ctx.params;
    const body = await readJson(req);
    const isAuto = boolField(body, "auto");

    const result = await submitAttempt({
      examId,
      studentId: student.id,
      userId: actor.id,
      isAuto,
      auditAction: isAuto ? "API_AUTO_SUBMIT_EXAM" : "API_SUBMIT_EXAM",
    });

    if (result.state === "NO_ATTEMPT") throw attemptNotFound();

    return apiOk({
      score: result.score,
      alreadySubmitted: result.state === "ALREADY_SUBMITTED",
    });
  });
}

export async function OPTIONS() {
  return preflight();
}
