import type { NextRequest } from "next/server";
import { apiOk, handle, notFound, preflight } from "@/server/http";
import { requireTeacher } from "@/server/auth";
import { findTeacherExam, listAttemptsForExam } from "@/server/modules/cbt/monitoring";
import { toMonitoring } from "@/server/modules/cbt/dto";

/**
 * GET /api/v1/cbt/teacher/monitoring/{examId}
 *
 * Peserta ujian beserta kemajuan pengerjaannya. Ujian yang bukan milik guru
 * dijawab 404, bukan 403, supaya keberadaannya tidak bocor.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ examId: string }> }) {
  return handle(async () => {
    const { teacher } = await requireTeacher(req);
    const { examId } = await ctx.params;

    const exam = await findTeacherExam(examId, teacher.id);
    if (!exam) throw notFound("Ujian tidak ditemukan", "EXAM_NOT_FOUND");

    const attempts = await listAttemptsForExam(examId);
    return apiOk(toMonitoring(exam, attempts));
  });
}

export async function OPTIONS() {
  return preflight();
}
