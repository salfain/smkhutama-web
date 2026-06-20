import type { Prisma } from "@/generated/prisma/client";

type ExamForMobile = Prisma.ExamGetPayload<{
  include: {
    subject: { select: { code: true; name: true } };
    questions: {
      include: { question: { include: { options: true } } };
    };
  };
}>;

type AttemptForMobile = {
  id: string;
  startedAt: Date | null;
  status: string;
  isLocked: boolean;
  lockReason: string | null;
  violationCount: number;
  answers: {
    questionId: string;
    selectedOptionId: string | null;
    answerText: string | null;
    isDoubtful: boolean;
    savedAt?: Date;
  }[];
};

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

function stableShuffle<T>(items: T[], seed: string, getKey: (item: T) => string) {
  return [...items].sort((a, b) =>
    hashString(`${seed}:${getKey(a)}`) - hashString(`${seed}:${getKey(b)}`)
  );
}

export function getAttemptExpiresAt(exam: { durationMinutes: number; endAt: Date }, startedAt: Date | null) {
  const started = startedAt ?? new Date();
  const expiresByDuration = new Date(started.getTime() + exam.durationMinutes * 60000);
  const expiresByExam = new Date(exam.endAt);
  return expiresByDuration < expiresByExam ? expiresByDuration : expiresByExam;
}

export function buildMobileExamPayload(exam: ExamForMobile, attempt: AttemptForMobile) {
  const expiresAt = getAttemptExpiresAt(exam, attempt.startedAt);
  const examQuestions = exam.randomizeQuestions
    ? stableShuffle(exam.questions, attempt.id, (eq) => eq.questionId)
    : exam.questions;

  const questions = examQuestions.map((eq) => {
    const options = exam.randomizeOptions
      ? stableShuffle(eq.question.options, `${attempt.id}:${eq.question.id}`, (option) => option.id)
      : [...eq.question.options].sort((a, b) => a.orderNumber - b.orderNumber);

    return {
      id: eq.question.id,
      orderNumber: eq.orderNumber,
      questionText: eq.question.questionText,
      questionType: eq.question.questionType,
      mediaType: eq.question.mediaType,
      mediaUrl: eq.question.mediaUrl,
      options: options.map((option) => ({
        id: option.id,
        label: option.optionLabel,
        text: option.optionText,
        mediaUrl: option.mediaUrl,
        orderNumber: option.orderNumber,
      })),
    };
  });

  const answers: Record<string, {
    selectedOptionId: string | null;
    answerText: string | null;
    isDoubtful: boolean;
    savedAt?: string;
  }> = {};
  for (const answer of attempt.answers) {
    answers[answer.questionId] = {
      selectedOptionId: answer.selectedOptionId,
      answerText: answer.answerText,
      isDoubtful: answer.isDoubtful,
      savedAt: answer.savedAt?.toISOString(),
    };
  }

  return {
    examId: exam.id,
    title: exam.title,
    subject: exam.subject,
    examType: exam.examType,
    status: exam.status,
    durationMinutes: exam.durationMinutes,
    startedAt: attempt.startedAt?.toISOString() ?? null,
    expiresAt: expiresAt.toISOString(),
    serverTime: new Date().toISOString(),
    randomizeOptions: exam.randomizeOptions,
    attempt: {
      status: attempt.status,
      isLocked: attempt.isLocked,
      lockReason: attempt.lockReason,
      violationCount: attempt.violationCount,
    },
    questions,
    answers,
  };
}
