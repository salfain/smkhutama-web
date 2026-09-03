import { requireAuth } from "@/lib/session";
import { listExamResults } from "@/server/modules/cbt/teacher";
import { TeacherResultsClient } from "./TeacherResultsClient";

export const dynamic = "force-dynamic";

export default async function TeacherResultsPage() {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return null;

  const exams = await listExamResults(user.teacher.id);

  const data = exams.map((exam) => ({
    id: exam.id,
    title: exam.title,
    status: exam.status,
    passingScore: exam.passingScore,
    subject: { code: exam.subject.code },
    attempts: exam.attempts.map((a) => ({
      id: a.id,
      score: a.score,
      status: a.status,
      student: {
        name: a.student.user.name,
        class: a.student.class?.name ?? "-",
      },
    })),
  }));

  return <TeacherResultsClient exams={data} />;
}
