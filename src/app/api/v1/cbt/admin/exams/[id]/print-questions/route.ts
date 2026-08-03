import type { NextRequest } from "next/server";
import { apiOk, forbidden, handle, notFound, preflight } from "@/server/http";
import { requireRole } from "@/server/auth";
import { canPrintExam, getExamForPrint, getSchoolProfile } from "@/server/modules/cbt/exam-print";
import { toExamPrint } from "@/server/modules/cbt/dto";

/**
 * GET /api/v1/cbt/admin/exams/{id}/print-questions
 *
 * Naskah soal untuk dicetak, lengkap dengan kunci jawaban. Admin boleh
 * mencetak ujian mana pun; guru hanya ujian miliknya sendiri.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const actor = await requireRole(req, "ADMIN_CBT", "TEACHER");
    const { id: examId } = await ctx.params;

    const exam = await getExamForPrint(examId);
    if (!exam) throw notFound("Ujian tidak ditemukan", "EXAM_NOT_FOUND");
    if (!canPrintExam(actor, exam)) throw forbidden();

    const school = await getSchoolProfile();
    return apiOk(toExamPrint(exam, school));
  });
}

export async function OPTIONS() {
  return preflight();
}
