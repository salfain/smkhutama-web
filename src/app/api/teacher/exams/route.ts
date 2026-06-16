import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "TEACHER");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const teacher = r.user.teacher;
  if (!teacher) return NextResponse.json({ error: "No teacher" }, { status: 400 });

  const exams = await prisma.exam.findMany({
    where: { teacherId: teacher.id },
    orderBy: { startAt: "desc" },
    include: {
      subject: { select: { code: true, name: true } },
      classes: { include: { class: { select: { name: true } } } },
      _count: { select: { questions: true, attempts: true } },
    },
  });

  return NextResponse.json(exams.map((e) => ({
    id: e.id, title: e.title, examType: e.examType, status: e.status,
    startAt: e.startAt, endAt: e.endAt, durationMinutes: e.durationMinutes,
    subject: e.subject,
    classes: e.classes.map((c) => c.class.name),
    questionCount: e._count.questions,
    attemptCount: e._count.attempts,
  })));
}
