import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "TEACHER");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const teacher = r.user.teacher;
  if (!teacher) return NextResponse.json({ error: "No teacher" }, { status: 400 });

  const questions = await prisma.question.findMany({
    where: { teacherId: teacher.id },
    orderBy: { createdAt: "desc" },
    include: {
      subject: { select: { code: true, name: true } },
      options: { orderBy: { orderNumber: "asc" } },
      _count: { select: { examQuestions: true } },
    },
  });

  return NextResponse.json(questions);
}
