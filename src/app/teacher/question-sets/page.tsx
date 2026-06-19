import { getMyQuestionSets, getQuestionSetImportData } from "./actions";
import { QuestionSetsClient } from "./QuestionSetsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Paket Bank Soal" };

export default async function QuestionSetsPage() {
  const [questionSets, importData] = await Promise.all([
    getMyQuestionSets(),
    getQuestionSetImportData(),
  ]);

  return (
    <QuestionSetsClient
      questionSets={questionSets.map((set) => ({
        id: set.id,
        title: set.title,
        examType: set.examType,
        grade: set.grade,
        source: set.source,
        status: set.status,
        sourceFileName: set.sourceFileName,
        totalQuestions: set.totalQuestions,
        multipleChoiceCount: set.multipleChoiceCount,
        essayCount: set.essayCount,
        invalidCount: set.invalidCount,
        createdAt: set.createdAt.toISOString(),
        subject: set.subject,
        _count: set._count,
      }))}
      subjects={importData.subjects}
      defaultSubjectId={importData.defaultSubjectId}
    />
  );
}
