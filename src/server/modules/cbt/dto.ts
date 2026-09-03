/**
 * Modul CBT - pemetaan record Prisma ke bentuk JSON API.
 *
 * Bentuknya sama persis dengan response route lama supaya aplikasi mobile
 * yang sudah beredar tidak perlu berubah saat pindah ke `/api/v1`.
 * Payload soal ujian sendiri dibangun `src/lib/mobile-exam.ts`, termasuk
 * pengacakan soal dan pilihan yang stabil per attempt.
 */

import type { getAttemptForReview } from "./review";
import type { listExams, listResults } from "./student";
import type { getTeacherCounts, listEssayAnswers, listTeacherExams } from "./teacher";
import type { findTeacherExam, listAttemptsForExam } from "./monitoring";
import type { getExamForPrint, getSchoolProfile } from "./exam-print";

type ExamListItem = Awaited<ReturnType<typeof listExams>>[number];
type ResultItem = Awaited<ReturnType<typeof listResults>>[number];
type AttemptReview = NonNullable<Awaited<ReturnType<typeof getAttemptForReview>>>;
type TeacherCounts = Awaited<ReturnType<typeof getTeacherCounts>>;
type TeacherExam = Awaited<ReturnType<typeof listTeacherExams>>[number];
type EssayAnswer = Awaited<ReturnType<typeof listEssayAnswers>>[number];
type MonitoredExam = NonNullable<Awaited<ReturnType<typeof findTeacherExam>>>;
type MonitoredAttempt = Awaited<ReturnType<typeof listAttemptsForExam>>[number];
type PrintableExam = NonNullable<Awaited<ReturnType<typeof getExamForPrint>>>;
type SchoolProfile = Awaited<ReturnType<typeof getSchoolProfile>>;

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
      class: attempt.student.class?.name ?? "-",
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

// ─── Sisi guru & admin ──────────────────────────────────────────────────────

/** `closedExams` sengaja tidak dikirim: endpoint lama tidak memuatnya. */
export function toTeacherStats(counts: TeacherCounts) {
  return {
    totalQuestions: counts.totalQuestions,
    totalExams: counts.totalExams,
    activeExams: counts.activeExams,
    pendingEssays: counts.pendingEssays,
    totalParticipants: counts.totalParticipants,
  };
}

export function toTeacherExam(exam: TeacherExam) {
  return {
    id: exam.id,
    title: exam.title,
    examType: exam.examType,
    status: exam.status,
    startAt: exam.startAt,
    endAt: exam.endAt,
    durationMinutes: exam.durationMinutes,
    subject: exam.subject,
    classes: exam.classes.map((c) => c.class.name),
    questionCount: exam._count.questions,
    attemptCount: exam._count.attempts,
  };
}

export function toMonitoring(exam: MonitoredExam, attempts: MonitoredAttempt[]) {
  return {
    exam: { id: exam.id, title: exam.title, totalQuestions: exam._count.questions },
    participants: attempts.map((attempt) => ({
      attemptId: attempt.id,
      studentName: attempt.student.user.name,
      className: attempt.student.class?.name ?? "-",
      status: attempt.status,
      answeredCount: attempt._count.answers,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      score: attempt.score,
    })),
  };
}

export function toEssayAnswer(answer: EssayAnswer) {
  return {
    id: answer.id,
    answerText: answer.answerText,
    score: answer.score,
    questionText: answer.question.questionText,
    subjectCode: answer.question.subject.code,
    studentName: answer.attempt.student.user.name,
    className: answer.attempt.student.class?.name ?? "-",
    examTitle: answer.attempt.exam.title,
  };
}

export function toExamPrint(exam: PrintableExam, school: SchoolProfile) {
  return {
    exam: {
      id: exam.id,
      title: exam.title,
      examType: exam.examType,
      durationMinutes: exam.durationMinutes,
      startAt: exam.startAt,
      passingScore: exam.passingScore,
      subject: exam.subject,
      teacherName: exam.teacher.user.name,
      academicYear: exam.academicYear,
      classNames: exam.classes.map((c) => c.class.name),
    },
    questions: exam.questions.map((examQuestion, index) => ({
      no: index + 1,
      id: examQuestion.question.id,
      questionText: examQuestion.question.questionText,
      questionType: examQuestion.question.questionType,
      mediaType: examQuestion.question.mediaType,
      mediaUrl: examQuestion.question.mediaUrl,
      explanation: examQuestion.question.explanation,
      options: examQuestion.question.options,
    })),
    school: school ? { name: school.name, address: school.address, npsn: school.npsn } : null,
  };
}
