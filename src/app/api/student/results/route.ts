import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student" }, { status: 400 });

  const attempts = await prisma.studentExamAttempt.findMany({
    where: { studentId: student.id, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
    orderBy: { submittedAt: "desc" },
    include: {
      exam: { include: { subject: { select: { code: true, name: true } } } },
      answers: { select: { isCorrect: true } },
    },
  });

  return NextResponse.json(attempts.map((a) => ({
    id: a.id,
    score: a.score,
    status: a.status,
    submittedAt: a.submittedAt,
    exam: {
      title: a.exam.title,
      examType: a.exam.examType,
      showResult: a.exam.showResult,
      passingScore: a.exam.passingScore,
      subject: a.exam.subject,
    },
    correct: a.answers.filter((x) => x.isCorrect === true).length,
    wrong: a.answers.filter((x) => x.isCorrect === false).length,
    total: a.answers.length,
  })));
}
