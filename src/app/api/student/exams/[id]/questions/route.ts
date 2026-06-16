import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student" }, { status: 400 });

  const { id: examId } = await params;

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      subject: { select: { code: true, name: true } },
      questions: {
        orderBy: { orderNumber: "asc" },
        include: { question: { include: { options: { orderBy: { orderNumber: "asc" } } } } },
      },
    },
  });
  if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });

  const attempt = await prisma.studentExamAttempt.findUnique({
    where: { examId_studentId: { examId, studentId: student.id } },
    include: { answers: { select: { questionId: true, selectedOptionId: true, answerText: true, isDoubtful: true } } },
  });
  if (!attempt) return NextResponse.json({ error: "Belum mulai ujian" }, { status: 400 });

  const startedAt = attempt.startedAt ?? new Date();
  const expiresByDuration = new Date(startedAt.getTime() + exam.durationMinutes * 60000);
  const expiresByExam = new Date(exam.endAt);
  const expiresAt = expiresByDuration < expiresByExam ? expiresByDuration : expiresByExam;

  let questions = exam.questions.map((eq) => ({
    id: eq.question.id,
    questionText: eq.question.questionText,
    questionType: eq.question.questionType,
    mediaType: eq.question.mediaType,
    mediaUrl: eq.question.mediaUrl,
    options: eq.question.options.map((o) => ({ id: o.id, label: o.optionLabel, text: o.optionText })),
  }));

  if (exam.randomizeQuestions) questions = questions.sort(() => Math.random() - 0.5);

  const answersMap: Record<string, { selectedOptionId?: string | null; answerText?: string | null; isDoubtful: boolean }> = {};
  for (const a of attempt.answers) {
    answersMap[a.questionId] = { selectedOptionId: a.selectedOptionId, answerText: a.answerText, isDoubtful: a.isDoubtful };
  }

  return NextResponse.json({
    examId: exam.id, title: exam.title, subject: exam.subject,
    durationMinutes: exam.durationMinutes, expiresAt: expiresAt.toISOString(),
    randomizeOptions: exam.randomizeOptions, questions, answers: answersMap,
  });
}
