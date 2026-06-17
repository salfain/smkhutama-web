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
    },
  });

  if (!survey) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: survey.id,
    title: survey.title,
    description: survey.description,
    isActive: survey.isActive,
    questions: survey.questions.map((q) => ({
      id: q.id,
      text: q.text,
      category: q.category,
      orderNumber: q.orderNumber,
    })),
  });
}
