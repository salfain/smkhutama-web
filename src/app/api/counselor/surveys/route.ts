import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { listSurveys, saveSurvey } from "@/server/modules/bk/surveys";
import { toSurvey } from "@/server/modules/bk/dto";

// Endpoint versi lama. Penggantinya: /api/v1/bk/counselor/surveys.
export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const surveys = await listSurveys();
  return NextResponse.json(surveys.map(toSurvey));
}

export async function POST(req: NextRequest) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const body = await req.json().catch(() => ({}));
  const { title, description, isActive } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const survey = await saveSurvey({
    title: title.trim(),
    description: typeof description === "string" ? description.trim() : null,
    isActive: isActive ?? true,
  });

  return NextResponse.json(survey, { status: 201 });
}
