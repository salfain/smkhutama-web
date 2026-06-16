import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student" }, { status: 400 });

  const { examId, questionId, selectedOptionId, answerText, isDoubtful } = await req.json();
  if (!examId || !questionId) {
    return NextResponse.json({ error: "examId dan questionId wajib" }, { status: 400 });
  }

  const attempt = await prisma.studentExamAttempt.findUnique({
    where: { examId_studentId: { examId, studentId: student.id } },
  });
  if (!attempt) return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });
  if (attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED") {
    return NextResponse.json({ error: "Ujian sudah disubmit" }, { status: 400 });
  }

  await prisma.studentAnswer.upsert({
    where: { attemptId_questionId: { attemptId: attempt.id, questionId } },
    update: {
      selectedOptionId: selectedOptionId ?? null,
      answerText: answerText ?? null,
      isDoubtful: isDoubtful ?? false,
      savedAt: new Date(),
    },
    create: {
      attemptId: attempt.id, questionId,
      selectedOptionId: selectedOptionId ?? null,
      answerText: answerText ?? null,
      isDoubtful: isDoubtful ?? false,
    },
  });

  return NextResponse.json({ success: true });
}
