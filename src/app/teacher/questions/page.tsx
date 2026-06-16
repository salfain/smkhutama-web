import { getMyQuestions } from "./actions";
import { QuestionsList } from "./QuestionsList";

export const dynamic = "force-dynamic";

export default async function QuestionsPage() {
  const questions = await getMyQuestions().catch(() => []);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Bank Soal</h1>
        <p className="text-sm text-gray-500">{questions.length} soal tersimpan</p>
      </div>
      <QuestionsList questions={questions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        difficulty: q.difficulty,
        grade: q.grade,
        isActive: q.isActive,
        subject: { code: q.subject.code },
        _count: q._count,
      }))} />
    </div>
  );
}
