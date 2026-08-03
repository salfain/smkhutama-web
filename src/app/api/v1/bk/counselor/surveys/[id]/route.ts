import type { NextRequest } from "next/server";
import { apiOk, handle, notFound, preflight } from "@/server/http";
import { requireCounselorAccess } from "@/server/auth";
import { getSurvey } from "@/server/modules/bk/surveys";
import { toSurveyDetail } from "@/server/modules/bk/dto";

/** GET /api/v1/bk/counselor/surveys/{id} — angket beserta pertanyaannya. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireCounselorAccess(req);
    const { id } = await ctx.params;

    const survey = await getSurvey(id);
    if (!survey) throw notFound("Angket tidak ditemukan");

    return apiOk(toSurveyDetail(survey));
  });
}

export async function OPTIONS() {
  return preflight();
}
