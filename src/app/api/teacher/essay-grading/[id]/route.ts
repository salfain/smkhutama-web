import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { calculateFinalScoreAfterManual } from "@/lib/exam-scoring";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "TEACHER");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const teacher = r.user.teacher;
  if (!teacher) return NextResponse.json({ error: "No teacher" }, { status: 400 });

  const { id: answerId } = await params;
  const { score } = await req.json();
  if (typeof score !== "number" || score < 0 || score > 100) {
    return NextResponse.json({ error: "Nilai harus 0–100" }, { status: 400 });
  }

  const answer = await prisma.studentAnswer.findUnique({
    where: { id: answerId },
    include: { question: true },
  });
  if (!answer) return NextResponse.json({ error: "Jawaban tidak ditemukan" }, { status: 404 });
  if (answer.question.teacherId !== teacher.id) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  await prisma.studentAnswer.update({
    where: { id: answerId },
    data: { score, isCorrect: score >= 60 },
  });

  const attempt = await prisma.studentExamAttempt.findUnique({
    where: { id: answer.attemptId },
    include: {
      answers: {
        include: { question: { include: { options: true } } },
      },
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

  if (attempt) {
    const finalScore = calculateFinalScoreAfterManual({
      questions: attempt.exam.questions.map((eq) => eq.question),
      answers: attempt.answers,
      multipleChoicePercentage: attempt.exam.multipleChoicePercentage,
      essayPercentage: attempt.exam.essayPercentage,
    });
    await prisma.studentExamAttempt.update({
      where: { id: answer.attemptId },
      data: { score: finalScore },
    });
  }

  return NextResponse.json({ success: true });
}
