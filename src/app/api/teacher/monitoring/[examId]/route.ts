import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
  const r = await requireApiAuth(req, "TEACHER");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const teacher = r.user.teacher;
  if (!teacher) return NextResponse.json({ error: "No teacher" }, { status: 400 });

  const { examId } = await params;
  const exam = await prisma.exam.findFirst({
    where: { id: examId, teacherId: teacher.id },
    include: { _count: { select: { questions: true } } },
  });
  if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });

  const attempts = await prisma.studentExamAttempt.findMany({
    where: { examId },
    include: {
      student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } },
      _count: { select: { answers: true } },
    },
  });

  return NextResponse.json({
    exam: { id: exam.id, title: exam.title, totalQuestions: exam._count.questions },
    participants: attempts.map((a) => ({
      attemptId: a.id,
      studentName: a.student.user.name,
      className: a.student.class?.name ?? "—",
      status: a.status,
      answeredCount: a._count.answers,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      score: a.score,
    })),
  });
}
