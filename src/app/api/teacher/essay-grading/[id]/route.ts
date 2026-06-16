import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

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

  // Recompute total score
  const allAnswers = await prisma.studentAnswer.findMany({
    where: { attemptId: answer.attemptId },
    include: { question: { select: { scoreWeight: true } } },
  });
  const allScored = allAnswers.every((a) => a.score !== null);
  if (allScored) {
    const totalWeight = allAnswers.reduce((s, a) => s + (a.question.scoreWeight ?? 1), 0);
    const totalScore = allAnswers.reduce((s, a) => s + ((a.score ?? 0) * (a.question.scoreWeight ?? 1)), 0);
    const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
    await prisma.studentExamAttempt.update({
      where: { id: answer.attemptId },
      data: { score: finalScore },
    });
  }

  return NextResponse.json({ success: true });
}
