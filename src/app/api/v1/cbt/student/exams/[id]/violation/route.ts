import type { NextRequest } from "next/server";
import { apiOk, handle, optionalString, preflight, readJson } from "@/server/http";
import { requireStudent } from "@/server/auth";
import { VIOLATION_LOCK_THRESHOLD, recordViolation } from "@/server/modules/cbt/exam-session";
import { attemptNotFound } from "@/server/modules/cbt/http-errors";

/**
 * POST /api/v1/cbt/student/exams/{id}/violation
 *
 * Laporan pelanggaran dari klien, mis. siswa berpindah aplikasi. Pelanggaran
 * yang terjadi saat offline dikirim menyusul lewat `offlineCount`.
 * Attempt yang sudah terkunci atau selesai dijawab apa adanya, bukan error -
 * klien tidak boleh gagal hanya karena melapor terlambat.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { actor, student } = await requireStudent(req);
    const { id: examId } = await ctx.params;
    const body = await readJson(req);

    const result = await recordViolation({
      examId,
      studentId: student.id,
      userId: actor.id,
      reason: optionalString(body, "reason"),
      offlineCount: body.offlineCount,
    });

    if (result.state === "NO_ATTEMPT") throw attemptNotFound();

    if (result.state === "FINISHED") {
      return apiOk({
        locked: false,
        finished: true,
        violationCount: result.violationCount,
        threshold: VIOLATION_LOCK_THRESHOLD,
        lockReason: null,
      });
    }
    if (result.state === "LOCKED") {
      return apiOk({
        locked: true,
        finished: false,
        violationCount: result.violationCount,
        threshold: VIOLATION_LOCK_THRESHOLD,
        lockReason: result.lockReason,
      });
    }

    return apiOk({
      locked: result.locked,
      finished: false,
      violationCount: result.violationCount,
      threshold: VIOLATION_LOCK_THRESHOLD,
      lockReason: result.lockReason,
    });
  });
}

export async function OPTIONS() {
  return preflight();
}
