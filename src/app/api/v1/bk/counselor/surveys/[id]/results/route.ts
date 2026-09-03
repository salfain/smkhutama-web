import type { NextRequest } from "next/server";
import { apiOk, handle, notFound, preflight } from "@/server/http";
import { requireCounselorAccess } from "@/server/auth";
import { getSurveyWithResponses, summarizeSurvey } from "@/server/modules/bk/surveys";

/** GET /api/v1/bk/counselor/surveys/{id}/results - rekap jawaban angket. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireCounselorAccess(req);
    const { id } = await ctx.params;

    const survey = await getSurveyWithResponses(id);
    if (!survey) throw notFound("Angket tidak ditemukan");

    const { perQuestion, priorities } = summarizeSurvey(survey);

    return apiOk({
      surveyId: survey.id,
      title: survey.title,
      responseCount: survey.responses.length,
      perQuestion,
      priorities,
      responses: survey.responses.map((response) => ({
        id: response.id,
        studentName: response.student.user.name,
        className: response.student.class?.name ?? "-",
        submittedAt: response.submittedAt,
      })),
    });
  });
}

export async function OPTIONS() {
  return preflight();
}
