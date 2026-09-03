import type { NextRequest } from "next/server";
import { apiOk, handle, preflight } from "@/server/http";
import { requireStudent } from "@/server/auth";
import { recordHeartbeat } from "@/server/modules/cbt/exam-session";
import { attemptNotFound } from "@/server/modules/cbt/http-errors";

/**
 * POST /api/v1/cbt/student/exams/{id}/heartbeat
 *
 * Denyut tiap ~30 detik selama ujian. Attempt yang sudah selesai atau
 * terkunci bukan error - klien perlu tahu keadaannya, bukan gagal.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { student } = await requireStudent(req);
    const { id: examId } = await ctx.params;

    const result = await recordHeartbeat(examId, student.id);
    if (result.state === "NO_ATTEMPT") throw attemptNotFound();

    if (result.state === "FINISHED") {
      return apiOk({ locked: false, finished: true, lockReason: null });
    }
    if (result.state === "LOCKED") {
      return apiOk({ locked: true, finished: false, lockReason: result.lockReason });
    }
    return apiOk({ locked: false, finished: false, lockReason: null });
  });
}

export async function OPTIONS() {
  return preflight();
}
