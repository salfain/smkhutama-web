import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;

  const attempt = await prisma.studentExamAttempt.findUnique({
    where: { id: attemptId },
    include: {
      student: {
        include: {
          user: { select: { name: true } },
          class: { select: { name: true } },
        },
      },
      exam: {
        select: {
          title: true,
          showResult: true,
          passingScore: true,
          subject: { select: { code: true, name: true } },
          questions: {
            orderBy: { orderNumber: "asc" },
            include: {
              question: {
                include: {
                  options: { orderBy: { orderNumber: "asc" } },
                },
              },
            },
          },
        },
      },
      answers: {
        include: {
          question: { select: { id: true } },
          selectedOption: { select: { id: true, optionLabel: true, optionText: true } },
        },
      },
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  }

  // Map jawaban siswa ke dalam format yang bersih
  const answersMap = new Map(
    attempt.answers.map((a) => [a.questionId, a])
  );

  const questions = attempt.exam.questions.map((eq, idx) => {
    const q = eq.question;
    const ans = answersMap.get(q.id);
    const correctOption = q.options.find((o) => o.isCorrect);

    return {
      number: idx + 1,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options.map((o) => ({
        id: o.id,
        label: o.optionLabel,
        text: o.optionText,
        isCorrect: o.isCorrect,
      })),
      studentAnswer: ans
        ? {
            selectedOptionId: ans.selectedOptionId,
            selectedLabel: ans.selectedOption?.optionLabel ?? null,
            selectedText: ans.selectedOption?.optionText ?? null,
            answerText: ans.answerText,
            isCorrect: ans.isCorrect,
            score: ans.score,
            isDoubtful: ans.isDoubtful,
          }
        : null,
      correctOptionLabel: correctOption?.optionLabel ?? null,
      correctOptionText: correctOption?.optionText ?? null,
      explanation: q.explanation,
    };
  });

  return NextResponse.json({
    student: {
      name: attempt.student.user.name,
      class: attempt.student.class?.name ?? "—",
      nis: attempt.student.nis,
    },
    exam: {
      title: attempt.exam.title,
      subject: attempt.exam.subject,
      passingScore: attempt.exam.passingScore,
    },
    score: attempt.score,
    status: attempt.status,
    submittedAt: attempt.submittedAt,
    questions,
  });
}
