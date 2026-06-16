import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { getQuestionById, getSubjectsForQuestion } from "../../actions";
import { QuestionForm } from "../../QuestionForm";

export const dynamic = "force-dynamic";

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth("TEACHER");
  const { id } = await params;
  const [question, subjects] = await Promise.all([
    getQuestionById(id).catch(() => null),
    getSubjectsForQuestion().catch(() => []),
  ]);

  if (!question) redirect("/teacher/questions");

  return (
    <QuestionForm
      subjects={subjects}
      existing={{
        id: question.id,
        subjectId: question.subjectId,
        questionType: question.questionType,
        questionText: question.questionText,
        difficulty: question.difficulty,
        scoreWeight: question.scoreWeight,
        explanation: question.explanation,
        material: question.material,
        grade: question.grade,
        options: question.options,
      }}
    />
  );
}
