import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { id } = await params;

  const survey = await prisma.survey.findUnique({ where: { id } });
  if (!survey) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  const body = await req.json();
  const { text, category } = body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Question text is required" }, { status: 400 });
  }

  // Get the next order number
  const last = await prisma.surveyQuestion.findFirst({
    where: { surveyId: id },
    orderBy: { orderNumber: "desc" },
  });
  const nextOrder = (last?.orderNumber ?? 0) + 1;

  const question = await prisma.surveyQuestion.create({
    data: {
      surveyId: id,
      text: text.trim(),
      category: category?.trim() || null,
      orderNumber: nextOrder,
    },
  });

  return NextResponse.json(question, { status: 201 });
}
