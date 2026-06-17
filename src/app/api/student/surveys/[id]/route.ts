import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const studentId = r.user.student?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 400 });
  }

  const { id } = await params;

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { orderNumber: "asc" } },
      responses: { where: { studentId }, select: { id: true } },
    },
  });

  if (!survey || !survey.isActive) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: survey.id,
    title: survey.title,
    description: survey.description,
    answered: survey.responses.length > 0,
    questions: survey.questions.map((q) => ({
      id: q.id,
      text: q.text,
      category: q.category,
      orderNumber: q.orderNumber,
    })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const studentId = r.user.student?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 400 });
  }

  const { id } = await params;

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: { questions: true },
  });

  if (!survey || !survey.isActive) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  // Check if already answered
  const existing = await prisma.surveyResponse.findUnique({
    where: { surveyId_studentId: { surveyId: id, studentId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already answered this survey" }, { status: 409 });
  }

  const body = await req.json();
  const { answers } = body;

  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: "Answers are required" }, { status: 400 });
  }

  // Validate each answer
  const questionIds = new Set(survey.questions.map((q) => q.id));
  for (const ans of answers) {
    if (!ans.questionId || !questionIds.has(ans.questionId)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 });
    }
    if (typeof ans.value !== "number" || ans.value < 1 || ans.value > 4) {
      return NextResponse.json({ error: "Value must be between 1 and 4" }, { status: 400 });
    }
  }

  // Create response with answers
  const response = await prisma.surveyResponse.create({
    data: {
      surveyId: id,
      studentId,
      answers: {
        create: answers.map((a: { questionId: string; value: number }) => ({
          questionId: a.questionId,
          value: a.value,
        })),
      },
    },
    include: { answers: true },
  });

  return NextResponse.json({ id: response.id, message: "Survey submitted successfully" }, { status: 201 });
}
