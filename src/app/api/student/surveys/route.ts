import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const studentId = r.user.student?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 400 });
  }

  // Get active surveys that have at least one question
  const surveys = await prisma.survey.findMany({
    where: {
      isActive: true,
      questions: { some: {} },
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { questions: true } },
      responses: {
        where: { studentId },
        select: { id: true },
      },
    },
  });

  return NextResponse.json(
    surveys.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      questionCount: s._count.questions,
      answered: s.responses.length > 0,
    }))
  );
}
