import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type AnswerPayload = {
  questionId?: string;
  selectedOptionId?: string | null;
  answerText?: string | null;
  isDoubtful?: boolean;
};

type ValidAnswer = {
  questionId: string;
  selectedOptionId: string | null;
  answerText: string | null;
  isDoubtful: boolean;
};

export async function POST(req: NextRequest) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const examId = String(body.examId ?? "").trim();
  const answers = Array.isArray(body.answers) ? body.answers as AnswerPayload[] : [];

  if (!examId) return NextResponse.json({ error: "examId wajib" }, { status: 400 });
  if (answers.length === 0) return NextResponse.json({ error: "answers wajib diisi" }, { status: 400 });
  if (answers.length > 100) return NextResponse.json({ error: "Maksimal 100 jawaban per sync" }, { status: 400 });

  const attempt = await prisma.studentExamAttempt.findUnique({
    where: { examId_studentId: { examId, studentId: student.id } },
  });
  if (!attempt) return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });
  if (attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED") {
    return NextResponse.json({ error: "Ujian sudah disubmit" }, { status: 400 });
  }
  if (attempt.isLocked) {
    return NextResponse.json({ error: "Ujian terkunci", locked: true, lockReason: attempt.lockReason }, { status: 423 });
  }

  const examQuestions = await prisma.examQuestion.findMany({
    where: { examId },
    include: { question: { select: { id: true, options: { select: { id: true } } } } },
  });
  const questionIds = new Set(examQuestions.map((eq) => eq.questionId));
  const optionToQuestion = new Map<string, string>();
  for (const eq of examQuestions) {
    for (const option of eq.question.options) optionToQuestion.set(option.id, eq.questionId);
  }

  const validAnswers: ValidAnswer[] = [];
  const errors: { questionId: string | null; error: string }[] = [];

  for (const answer of answers) {
    const questionId = String(answer.questionId ?? "").trim();
    const selectedOptionId = answer.selectedOptionId ? String(answer.selectedOptionId).trim() : null;
    if (!questionId) {
      errors.push({ questionId: null, error: "questionId wajib" });
      continue;
    }
    if (!questionIds.has(questionId)) {
      errors.push({ questionId, error: "Soal bukan bagian dari ujian ini" });
      continue;
    }
    if (selectedOptionId && optionToQuestion.get(selectedOptionId) !== questionId) {
      errors.push({ questionId, error: "Pilihan jawaban tidak sesuai soal" });
      continue;
    }
    validAnswers.push({
      questionId,
      selectedOptionId,
      answerText: answer.answerText ?? null,
      isDoubtful: answer.isDoubtful ?? false,
    });
  }

  if (validAnswers.length === 0) {
    return NextResponse.json({ error: "Tidak ada jawaban valid", synced: 0, errors }, { status: 400 });
  }

  await prisma.$transaction(validAnswers.map((answer) =>
    prisma.studentAnswer.upsert({
      where: { attemptId_questionId: { attemptId: attempt.id, questionId: answer.questionId } },
      update: {
        selectedOptionId: answer.selectedOptionId ?? null,
        answerText: answer.answerText ?? null,
        isDoubtful: answer.isDoubtful ?? false,
        savedAt: new Date(),
      },
      create: {
        attemptId: attempt.id,
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId ?? null,
        answerText: answer.answerText ?? null,
        isDoubtful: answer.isDoubtful ?? false,
      },
    })
  ));

  return NextResponse.json({
    success: true,
    synced: validAnswers.length,
    failed: errors.length,
    errors,
    serverTime: new Date().toISOString(),
  });
}
