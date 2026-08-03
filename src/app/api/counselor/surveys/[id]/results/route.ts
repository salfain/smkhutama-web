import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { getSurveyAnswers, summarizeSurvey } from "@/server/modules/bk/surveys";

// Endpoint versi lama.
// Penggantinya: GET /api/v1/bk/counselor/surveys/{id}/results, yang juga
// memuat daftar responden.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { id } = await params;
  const survey = await getSurveyAnswers(id);
  if (!survey) return NextResponse.json({ error: "Survey not found" }, { status: 404 });

  const { perQuestion, priorities } = summarizeSurvey(survey);

  return NextResponse.json({
    surveyId: id,
    title: survey.title,
    responseCount: survey.responses.length,
    perQuestion,
    priorities,
  });
}
