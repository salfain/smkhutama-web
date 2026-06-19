import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

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
      exam: { select: { questions: { include: { question: { select: { id: true, scoreWeight: true, questionType: true } } } } } },
    },
  });
  if (!attempt) return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });
  if (attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED") {
    return NextResponse.json({ success: true, score: attempt.score });
  }

  const allExamQuestions = attempt.exam.questions;
  const answeredMap = new Map(attempt.answers.map((a) => [a.questionId, a]));

  let totalWeight = 0;
  let earnedWeight = 0;
  const updates: { id: string; isCorrect: boolean | null; score: number | null }[] = [];
  let hasUngradedEssay = false;

  for (const eq of allExamQuestions) {
    const q = eq.question;
    const weight = q.scoreWeight ?? 1;
    totalWeight += weight;
    const ans = answeredMap.get(q.id);

    if (q.questionType === "ESSAY" || q.questionType === "SHORT_ANSWER") {
      hasUngradedEssay = true;
      if (ans) updates.push({ id: ans.id, isCorrect: null, score: null });
      continue;
    }
    if (!ans || !ans.selectedOptionId) {
      if (ans) updates.push({ id: ans.id, isCorrect: false, score: 0 });
      continue;
    }
    if (q.questionType === "MULTIPLE_CHOICE" || q.questionType === "TRUE_FALSE") {
      const correctOpt = ans.question.options.find((o) => o.isCorrect);
      const isCorrect = !!correctOpt && ans.selectedOptionId === correctOpt.id;
      updates.push({ id: ans.id, isCorrect, score: isCorrect ? 100 : 0 });
      if (isCorrect) earnedWeight += weight;
      continue;
    }
    if (q.questionType === "MULTIPLE_CHOICE_COMPLEX") {
      const correctIds = ans.question.options.filter((o) => o.isCorrect).map((o) => o.id);
      const isCorrect = correctIds.includes(ans.selectedOptionId!);
      updates.push({ id: ans.id, isCorrect, score: isCorrect ? 100 : 0 });
      if (isCorrect) earnedWeight += weight;
      continue;
    }
    if (ans) { updates.push({ id: ans.id, isCorrect: null, score: null }); hasUngradedEssay = true; }
  }

  const finalScore = hasUngradedEssay ? null : (totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0);

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
