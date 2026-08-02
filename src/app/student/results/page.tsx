import { requireAuth } from "@/lib/session";
import { listResults } from "@/server/modules/cbt/student";
import { StudentResultsClient } from "./StudentResultsClient";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentResultsPage() {
  const c = await cookies();
  const system = c.get("student-system")?.value || "CBT";
  if (system === "SIBIKONS") redirect("/student/bk");

  const user = await requireAuth("STUDENT");
  if (!user.student) return null;

  const attempts = await listResults(user.student.id);

  const data = attempts.map((a) => ({
    id: a.id,
    score: a.score,
    submittedAt: a.submittedAt?.toISOString() ?? null,
    exam: {
      title: a.exam.title,
      showResult: a.exam.showResult,
      passingScore: a.exam.passingScore,
      subject: a.exam.subject,
    },
    correct: a.answers.filter((x) => x.isCorrect === true).length,
    wrong: a.answers.filter((x) => x.isCorrect === false).length,
    empty: a.answers.filter((x) => x.isCorrect === null).length,
  }));

  return (
    <StudentResultsClient
      attempts={data}
      studentName={user.name}
      className={user.student.class?.name ?? "—"}
    />
  );
}
