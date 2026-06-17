import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { id } = await params;

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { orderNumber: "asc" } },
      responses: { include: { answers: true } },
    },
  });

  if (!survey) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  const responseCount = survey.responses.length;

  // Calculate per-question averages
  const perQuestion = survey.questions.map((q) => {
    const answers = survey.responses.flatMap((r) =>
      r.answers.filter((a) => a.questionId === q.id)
    );
    const total = answers.reduce((sum, a) => sum + a.value, 0);
    const avg = answers.length > 0 ? total / answers.length : 0;
    return {
      questionId: q.id,
      text: q.text,
      category: q.category,
      average: Math.round(avg * 100) / 100,
      answerCount: answers.length,
    };
  });

  // Top 5 priorities (highest average = most needed)
  const priorities = [...perQuestion]
    .sort((a, b) => b.average - a.average)
    .slice(0, 5);

  return NextResponse.json({
    surveyId: id,
    title: survey.title,
    responseCount,
    perQuestion,
    priorities,
  });
}
