import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import {
  getSurveyForStudent,
  hasResponded,
  submitSurveyResponse,
} from "@/server/modules/bk/surveys";
import { toStudentSurveyDetail } from "@/server/modules/bk/dto";

// Endpoint versi lama. Penggantinya: /api/v1/bk/student/surveys/{id}.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const studentId = r.user.student?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 400 });
  }

  const { id } = await params;
  const survey = await getSurveyForStudent(id, studentId);
  if (!survey) return NextResponse.json({ error: "Survey not found" }, { status: 404 });

  return NextResponse.json(toStudentSurveyDetail(survey));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const studentId = r.user.student?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 400 });
  }

  const { id } = await params;
  const survey = await getSurveyForStudent(id, studentId);
  if (!survey) return NextResponse.json({ error: "Survey not found" }, { status: 404 });

  if (await hasResponded(id, studentId)) {
    return NextResponse.json({ error: "Already answered this survey" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const { answers } = body;

  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: "Answers are required" }, { status: 400 });
  }

  const questionIds = new Set(survey.questions.map((q) => q.id));
  for (const answer of answers) {
    if (!answer?.questionId || !questionIds.has(answer.questionId)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 });
    }
    if (typeof answer.value !== "number" || answer.value < 1 || answer.value > 4) {
      return NextResponse.json({ error: "Value must be between 1 and 4" }, { status: 400 });
    }
  }

  const response = await submitSurveyResponse(
    id,
    studentId,
    answers.map((a: { questionId: string; value: number }) => ({
      questionId: a.questionId,
      value: a.value,
    }))
  );

  return NextResponse.json(
    { id: response.id, message: "Survey submitted successfully" },
    { status: 201 }
  );
}
