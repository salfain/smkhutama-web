import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { getSurvey, saveQuestion } from "@/server/modules/bk/surveys";

// Endpoint versi lama.
// Penggantinya: POST /api/v1/bk/counselor/surveys/{id}/questions.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { id } = await params;
  const survey = await getSurvey(id);
  if (!survey) return NextResponse.json({ error: "Survey not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { text, category } = body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Question text is required" }, { status: 400 });
  }

  const question = await saveQuestion({
    surveyId: id,
    text: text.trim(),
    category: typeof category === "string" ? category.trim() : null,
  });

  return NextResponse.json(question, { status: 201 });
}
