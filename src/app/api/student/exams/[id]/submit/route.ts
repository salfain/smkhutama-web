import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { calculateSubmissionScore } from "@/lib/exam-scoring";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student" }, { status: 400 });

  const { id: examId } = await params;
  const body = await req.json().catch(() => ({}));
  const isAuto = body.auto === true;

  const attempt = await prisma.studentExamAttempt.findUnique({
    where: { examId_studentId: { examId, studentId: student.id } },
    include: {
      answers: { include: { question: { include: { options: true } } } },
      exam: {
        select: {
          multipleChoicePercentage: true,
          essayPercentage: true,
          questions: {
            include: { question: { select: { id: true, scoreWeight: true, questionType: true } } },
          },
        },
      },
    },
  });
  if (!attempt) return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });
  if (attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED") {
    return NextResponse.json({ success: true, score: attempt.score });
  }

  const { updates, finalScore } = calculateSubmissionScore({
    questions: attempt.exam.questions.map((eq) => eq.question),
    answers: attempt.answers,
    multipleChoicePercentage: attempt.exam.multipleChoicePercentage,
    essayPercentage: attempt.exam.essayPercentage,
  });

  await prisma.$transaction([
    ...updates.map((u) => prisma.studentAnswer.update({ where: { id: u.id }, data: { isCorrect: u.isCorrect, score: u.score } })),
    prisma.studentExamAttempt.update({
      where: { id: attempt.id },
      data: { status: isAuto ? "AUTO_SUBMITTED" : "SUBMITTED", submittedAt: new Date(), score: finalScore, loginStatus: false },
    }),
  ]);
  await logAudit({
    userId: r.user.id,
    action: isAuto ? "API_AUTO_SUBMIT_EXAM" : "API_SUBMIT_EXAM",
    entity: "studentExamAttempt",
    entityId: attempt.id,
    details: { examId, studentId: student.id, score: finalScore },
  });

  return NextResponse.json({ success: true, score: finalScore });
}
