import type { NextRequest } from "next/server";
import { apiOk, badRequest, forbidden, handle, notFound, preflight, readJson } from "@/server/http";
import { requireTeacher } from "@/server/auth";
import { gradeEssay } from "@/server/modules/cbt/teacher";

const MIN_SCORE = 0;
const MAX_SCORE = 100;

/**
 * PATCH /api/v1/cbt/teacher/essay-grading/{id}
 *
 * Beri nilai satu jawaban esai. Nilai akhir attempt dihitung ulang otomatis,
 * dan tetap kosong selama masih ada jawaban manual lain yang belum dinilai.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { teacher } = await requireTeacher(req);
    const { id: answerId } = await ctx.params;
    const body = await readJson(req);

    const score = body.score;
    if (typeof score !== "number" || score < MIN_SCORE || score > MAX_SCORE) {
      throw badRequest(`Nilai harus ${MIN_SCORE}-${MAX_SCORE}`, "VALIDATION_ERROR");
    }

    const result = await gradeEssay({
      answerId,
      teacherId: teacher.id,
      score,
      auditAction: "API_GRADE_ESSAY",
    });

    if (result === "NOT_FOUND") throw notFound("Jawaban tidak ditemukan", "ANSWER_NOT_FOUND");
    if (result === "FORBIDDEN") throw forbidden();

    return apiOk({ id: answerId, score });
  });
}

export async function OPTIONS() {
  return preflight();
}
