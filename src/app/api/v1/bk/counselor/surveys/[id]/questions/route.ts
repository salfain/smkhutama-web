import type { NextRequest } from "next/server";
import {
  apiOk,
  handle,
  notFound,
  optionalString,
  preflight,
  readJson,
  requiredString,
} from "@/server/http";
import { requireCounselorAccess } from "@/server/auth";
import { getSurvey, saveQuestion } from "@/server/modules/bk/surveys";

/** POST /api/v1/bk/counselor/surveys/{id}/questions - tambah pertanyaan. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireCounselorAccess(req);
    const { id } = await ctx.params;

    const survey = await getSurvey(id);
    if (!survey) throw notFound("Angket tidak ditemukan");

    const body = await readJson(req);
    const question = await saveQuestion({
      surveyId: id,
      text: requiredString(body, "text"),
      category: optionalString(body, "category"),
    });

    return apiOk(
      {
        id: question.id,
        surveyId: question.surveyId,
        text: question.text,
        category: question.category,
        orderNumber: question.orderNumber,
      },
      201
    );
  });
}

export async function OPTIONS() {
  return preflight();
}
