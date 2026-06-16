import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student profile" }, { status: 400 });

  const classId = student.classId;
  const exams = await prisma.exam.findMany({
    where: classId ? { classes: { some: { classId } } } : {},
    orderBy: { startAt: "desc" },
    include: {
      subject: { select: { code: true, name: true } },
      _count: { select: { questions: true } },
      attempts: { where: { studentId: student.id }, take: 1 },
    },
  });

  return NextResponse.json(exams.map((e) => ({
    id: e.id, title: e.title, examType: e.examType, status: e.status,
    startAt: e.startAt, endAt: e.endAt, durationMinutes: e.durationMinutes,
    subject: e.subject, questionCount: e._count.questions,
    attempt: e.attempts[0] ? { status: e.attempts[0].status, score: e.attempts[0].score } : null,
  })));
}
