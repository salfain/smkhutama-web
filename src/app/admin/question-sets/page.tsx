import { getAdminQuestionSetData } from "./actions";
import { QuestionSetsAdminClient } from "./QuestionSetsAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminQuestionSetsPage() {
  const data = await getAdminQuestionSetData().catch(() => ({
    questionSets: [],
    subjects: [],
    teachers: [],
  }));

  return (
    <QuestionSetsAdminClient
      questionSets={data.questionSets.map((set) => ({
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
        ownerTeacher: set.ownerTeacher,
        _count: set._count,
      }))}
      subjects={data.subjects}
      teachers={data.teachers}
    />
  );
}
