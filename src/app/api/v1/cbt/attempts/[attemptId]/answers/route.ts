import type { NextRequest } from "next/server";
import { apiOk, forbidden, handle, notFound, preflight } from "@/server/http";
import { requireActor } from "@/server/auth";
import { canReviewAttempt, getAttemptForReview } from "@/server/modules/cbt/review";
import { toAttemptReview } from "@/server/modules/cbt/dto";

/**
 * GET /api/v1/cbt/attempts/{attemptId}/answers
 *
 * Lembar jawaban satu attempt beserta kunci jawabannya. Karena isinya kunci
 * jawaban, aksesnya dibatasi: guru, admin, dan guru BK boleh melihat attempt
 * siapa pun, siswa hanya miliknya sendiri.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ attemptId: string }> }) {
  return handle(async () => {
    const actor = await requireActor(req);
    const { attemptId } = await ctx.params;

    const attempt = await getAttemptForReview(attemptId);
    if (!attempt) throw notFound("Attempt tidak ditemukan", "ATTEMPT_NOT_FOUND");
    if (!canReviewAttempt(actor, attempt)) throw forbidden();

    return apiOk(toAttemptReview(attempt));
  });
}

export async function OPTIONS() {
  return preflight();
}
