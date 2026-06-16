import { requireAuth } from "@/lib/session";
import { getExamFormDataForTeacher } from "../actions";
import { ExamCreateForm } from "./ExamCreateForm";

export const dynamic = "force-dynamic";

export default async function CreateExamPage() {
  const user = await requireAuth("TEACHER");
  const data = await getExamFormDataForTeacher().catch(() => ({
    subjects: [], classes: [], academicYears: [], myQuestions: [],
  }));

  return (
    <ExamCreateForm
      subjects={data.subjects}
      classes={data.classes}
      academicYears={data.academicYears}
      myQuestions={data.myQuestions}
      defaultSubjectId={user.teacher?.subjectId ?? null}
    />
  );
}
