import { redirect, notFound } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { getExamForTaking } from "../actions";
import { TakeExam } from "./TakeExam";

export const dynamic = "force-dynamic";

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth("STUDENT");
  if (!user.student) redirect("/login");
  const { id } = await params;

  const exam = await getExamForTaking(id);
  if (!exam) notFound();
  if (exam.finished) redirect(`/student/exams/${id}/finish`);

  // Hitung waktu berakhir berdasarkan startedAt + duration (atau exam.endAt)
  const startedAt = exam.attempt.startedAt ?? new Date();
  const expiresByDuration = new Date(startedAt.getTime() + exam.durationMinutes * 60 * 1000);
  const expiresByExam = new Date(exam.endAt);
  const expiresAt = expiresByDuration < expiresByExam ? expiresByDuration : expiresByExam;

  // Build initial data
  const questions = exam.questions.map((eq) => ({
    id: eq.question.id,
    questionText: eq.question.questionText,
    questionType: eq.question.questionType,
    options: eq.question.options.map((o) => ({
      id: o.id, label: o.optionLabel, text: o.optionText,
    })),
  }));

  // Random urutan jika randomizeQuestions
  if (exam.randomizeQuestions) {
    questions.sort(() => Math.random() - 0.5);
  }

  // Initial answers map
  const answersMap: Record<string, { selectedOptionId?: string | null; answerText?: string | null; isDoubtful: boolean }> = {};
  for (const a of exam.attempt.answers) {
    answersMap[a.questionId] = {
      selectedOptionId: a.selectedOptionId ?? null,
      answerText: a.answerText ?? null,
      isDoubtful: a.isDoubtful,
    };
  }

  return (
    <TakeExam
      examId={exam.id}
      title={exam.title}
      subjectCode={exam.subject.code}
      questions={questions}
      initialAnswers={answersMap}
      expiresAt={expiresAt.toISOString()}
      randomizeOptions={exam.randomizeOptions}
    />
  );
}
