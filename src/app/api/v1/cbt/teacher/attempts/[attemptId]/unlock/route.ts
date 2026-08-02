import type { NextRequest } from "next/server";
import { apiOk, forbidden, handle, notFound, preflight } from "@/server/http";
import { requireTeacher } from "@/server/auth";
import { findAttemptWithExam, unlockAttempt } from "@/server/modules/cbt/monitoring";

/**
 * POST /api/v1/cbt/teacher/attempts/{attemptId}/unlock
 *
 * Buka kunci siswa yang terkunci anti-curang, sekaligus mereset hitungan
 * pelanggarannya. Sebelumnya hanya bisa lewat halaman web, sehingga pengawas
 * yang memantau dari ponsel tidak bisa menolong siswa yang terkunci.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ attemptId: string }> }) {
  return handle(async () => {
    const { teacher } = await requireTeacher(req);
    const { attemptId } = await ctx.params;

    const attempt = await findAttemptWithExam(attemptId);
    if (!attempt) throw notFound("Attempt tidak ditemukan", "ATTEMPT_NOT_FOUND");
    if (attempt.exam.teacherId !== teacher.id) throw forbidden();

    const result = await unlockAttempt(attemptId, "TEACHER_UNLOCK_EXAM_ATTEMPT");
    if (result === "NOT_FOUND") throw notFound("Attempt tidak ditemukan", "ATTEMPT_NOT_FOUND");

    return apiOk({ attemptId, isLocked: false, violationCount: 0 });
  });
}

export async function OPTIONS() {
  return preflight();
}
