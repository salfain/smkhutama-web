/**
 * Modul CBT — pemetaan record Prisma ke bentuk JSON API.
 *
 * Bentuknya sama persis dengan response route lama supaya aplikasi mobile
 * yang sudah beredar tidak perlu berubah saat pindah ke `/api/v1`.
 * Payload soal ujian sendiri dibangun `src/lib/mobile-exam.ts`, termasuk
 * pengacakan soal dan pilihan yang stabil per attempt.
 */

import type { getAttemptForReview } from "./review";
import type { listExams, listResults } from "./student";

type ExamListItem = Awaited<ReturnType<typeof listExams>>[number];
type ResultItem = Awaited<ReturnType<typeof listResults>>[number];
type AttemptReview = NonNullable<Awaited<ReturnType<typeof getAttemptForReview>>>;

export function toExamListItem(exam: ExamListItem) {
  const attempt = exam.attempts[0];
  return {
    id: exam.id,
    title: exam.title,
    examType: exam.examType,
    status: exam.status,
    startAt: exam.startAt,
    endAt: exam.endAt,
    durationMinutes: exam.durationMinutes,
    subject: exam.subject,
    questionCount: exam._count.questions,
    attempt: attempt ? { status: attempt.status, score: attempt.score } : null,
  };
}

export function toResult(attempt: ResultItem) {
  return {
    id: attempt.id,
    score: attempt.score,
    status: attempt.status,
    submittedAt: attempt.submittedAt,
    exam: {
      title: attempt.exam.title,
      examType: attempt.exam.examType,
      showResult: attempt.exam.showResult,
      passingScore: attempt.exam.passingScore,
      subject: attempt.exam.subject,
    },
    correct: attempt.answers.filter((a) => a.isCorrect === true).length,
    wrong: attempt.answers.filter((a) => a.isCorrect === false).length,
    total: attempt.answers.length,
  };
}

export function toAttemptStatus(attempt: {
  isLocked: boolean;
  violationCount: number;
  status: string;
  lockReason: string | null;
}) {
  return {
    isLocked: attempt.isLocked,
    violationCount: attempt.violationCount,
    // Bila sudah SUBMITTED / AUTO_SUBMITTED, klien mengarahkan ke halaman selesai.
    status: attempt.status,
    lockReason: attempt.lockReason,
  };
}

/** Bentuk `resume` untuk siswa yang belum pernah memulai ujian ini. */
export function toResumeWithoutAttempt(exam: {
  id: string;
  title: string;
  subject: { code: string; name: string };
  examType: string;
  status: string;
}) {
  return {
    examId: exam.id,
    title: exam.title,
    subject: exam.subject,
    examType: exam.examType,
    status: exam.status,
    serverTime: new Date().toISOString(),
    attempt: null,
  };
}

export function toAttemptReview(attempt: AttemptReview) {
  const answerByQuestion = new Map(attempt.answers.map((a) => [a.questionId, a]));

  const questions = attempt.exam.questions.map((examQuestion, index) => {
    const question = examQuestion.question;
    const answer = answerByQuestion.get(question.id);
    const correctOption = question.options.find((o) => o.isCorrect);

    return {
      number: index + 1,
      questionText: question.questionText,
      questionType: question.questionType,
      options: question.options.map((o) => ({
        id: o.id,
        label: o.optionLabel,
        text: o.optionText,
        isCorrect: o.isCorrect,
      })),
      studentAnswer: answer
        ? {
            selectedOptionId: answer.selectedOptionId,
            selectedLabel: answer.selectedOption?.optionLabel ?? null,
            selectedText: answer.selectedOption?.optionText ?? null,
            answerText: answer.answerText,
            isCorrect: answer.isCorrect,
            score: answer.score,
            isDoubtful: answer.isDoubtful,
          }
        : null,
      correctOptionLabel: correctOption?.optionLabel ?? null,
      correctOptionText: correctOption?.optionText ?? null,
      explanation: question.explanation,
    };
  });

  return {
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
  };
}
