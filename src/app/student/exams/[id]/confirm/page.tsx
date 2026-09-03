import { redirect, notFound } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { findAttempt, getExamSummary, isSubmitted } from "@/server/modules/cbt/exam-session";
import { ConfirmStart } from "./ConfirmStart";

export const dynamic = "force-dynamic";

export default async function ConfirmPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth("STUDENT");
  if (!user.student) redirect("/login");
  const { id } = await params;

  const exam = await getExamSummary(id);
  if (!exam) notFound();

  const existing = await findAttempt(id, user.student.id);
  if (existing && isSubmitted(existing.status)) {
    redirect(`/student/exams/${id}/finish`);
  }

  return (
    <ConfirmStart
      examId={exam.id}
      title={exam.title}
      subjectName={exam.subject.name}
      studentName={user.name}
      className={user.student.class?.name ?? "-"}
      questions={exam._count.questions}
      duration={exam.durationMinutes}
      startAt={exam.startAt}
      endAt={exam.endAt}
      isResume={existing?.status === "IN_PROGRESS"}
    />
  );
}
