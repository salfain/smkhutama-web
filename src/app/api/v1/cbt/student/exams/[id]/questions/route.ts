import type { NextRequest } from "next/server";
import { apiOk, badRequest, handle, notFound, preflight } from "@/server/http";
import { requireStudent } from "@/server/auth";
import { buildMobileExamPayload } from "@/lib/mobile-exam";
import { getAttemptWithAnswers, getExamWithQuestions } from "@/server/modules/cbt/exam-session";

/**
 * GET /api/v1/cbt/student/exams/{id}/questions
 *
 * Soal beserta jawaban yang sudah tersimpan. Urutan soal dan pilihan diacak
 * stabil per attempt bila ujiannya diatur demikian, jadi siswa yang membuka
 * ulang tetap melihat urutan yang sama.
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
    if (!attempt) throw badRequest("Belum mulai ujian", "ATTEMPT_NOT_STARTED");

    return apiOk(buildMobileExamPayload(exam, attempt));
  });
}

export async function OPTIONS() {
  return preflight();
}
