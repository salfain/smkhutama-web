import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "TEACHER");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const teacher = r.user.teacher;
  if (!teacher) return NextResponse.json({ error: "No teacher" }, { status: 400 });

  const essays = await prisma.studentAnswer.findMany({
    where: {
      question: { teacherId: teacher.id, questionType: "ESSAY" },
      attempt: { status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
    },
    orderBy: { savedAt: "asc" },
    include: {
      question: { select: { questionText: true, subject: { select: { code: true } } } },
      attempt: {
        include: {
          student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } },
          exam: { select: { title: true } },
        },
      },
    },
  });

  return NextResponse.json(essays.map((e) => ({
    id: e.id,
    answerText: e.answerText,
    score: e.score,
    questionText: e.question.questionText,
    subjectCode: e.question.subject.code,
    studentName: e.attempt.student.user.name,
    className: e.attempt.student.class?.name ?? "—",
    examTitle: e.attempt.exam.title,
  })));
}
