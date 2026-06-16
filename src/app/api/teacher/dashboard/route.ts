import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "TEACHER");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const teacher = r.user.teacher;
  if (!teacher) return NextResponse.json({ error: "No teacher profile" }, { status: 400 });

  const [totalQuestions, totalExams, activeExams, pendingEssays, totalParticipants] = await Promise.all([
    prisma.question.count({ where: { teacherId: teacher.id, isActive: true } }),
    prisma.exam.count({ where: { teacherId: teacher.id } }),
    prisma.exam.count({ where: { teacherId: teacher.id, status: "ACTIVE" } }),
    prisma.studentAnswer.count({
      where: { question: { teacherId: teacher.id, questionType: "ESSAY" }, score: null, attempt: { status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } } },
    }),
    prisma.studentExamAttempt.count({ where: { exam: { teacherId: teacher.id } } }),
  ]);

  return NextResponse.json({ totalQuestions, totalExams, activeExams, pendingEssays, totalParticipants });
}
