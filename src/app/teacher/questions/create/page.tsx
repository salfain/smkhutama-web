import { requireAuth } from "@/lib/session";
import { getSubjectsForQuestion } from "../actions";
import { QuestionForm } from "../QuestionForm";

export const dynamic = "force-dynamic";

export default async function CreateQuestionPage() {
  const user = await requireAuth("TEACHER");
  const subjects = await getSubjectsForQuestion().catch(() => []);

  return <QuestionForm subjects={subjects} defaultSubjectId={user.teacher?.subjectId ?? null} />;
}
