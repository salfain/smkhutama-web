import { CheckSquare } from "lucide-react";
import { getPendingEssays } from "./actions";
import { EssayGradingList } from "./EssayGradingList";

export const dynamic = "force-dynamic";

export default async function EssayGradingPage() {
  const essays = await getPendingEssays().catch(() => []);

  const pending = essays.filter((e) => e.score === null);
  const graded = essays.filter((e) => e.score !== null);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Koreksi Esai</h1>
        <p className="text-sm text-gray-500">
          {pending.length} jawaban perlu dikoreksi · {graded.length} sudah dinilai
        </p>
      </div>

      {essays.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <CheckSquare className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Tidak ada jawaban esai untuk dikoreksi</p>
        </div>
      ) : (
        <EssayGradingList essays={essays.map((e) => ({
          id: e.id,
          answerText: e.answerText ?? "",
          score: e.score,
          question: { questionText: e.question.questionText, subject: { code: e.question.subject.code } },
          attempt: {
            student: { user: { name: e.attempt.student.user.name }, class: e.attempt.student.class },
            exam: { title: e.attempt.exam.title },
          },
        }))} />
      )}
    </div>
  );
}
