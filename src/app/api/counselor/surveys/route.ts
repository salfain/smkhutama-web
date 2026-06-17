import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const surveys = await prisma.survey.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { questions: true, responses: true } },
    },
  });

  return NextResponse.json(
    surveys.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      isActive: s.isActive,
      questionCount: s._count.questions,
      responseCount: s._count.responses,
      createdAt: s.createdAt,
    }))
  );
}

export async function POST(req: NextRequest) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const body = await req.json();
  const { title, description, isActive } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const survey = await prisma.survey.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      isActive: isActive ?? true,
    },
  });

  return NextResponse.json(survey, { status: 201 });
}
