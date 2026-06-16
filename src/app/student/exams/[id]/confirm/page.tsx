import { redirect, notFound } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ConfirmStart } from "./ConfirmStart";

export const dynamic = "force-dynamic";

export default async function ConfirmPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth("STUDENT");
  if (!user.student) redirect("/login");
  const { id } = await params;

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      subject: { select: { code: true, name: true } },
      _count: { select: { questions: true } },
    },
  });
  if (!exam) notFound();

  const existing = await prisma.studentExamAttempt.findUnique({
    where: { examId_studentId: { examId: id, studentId: user.student.id } },
  });
  if (existing && (existing.status === "SUBMITTED" || existing.status === "AUTO_SUBMITTED")) {
    redirect(`/student/exams/${id}/finish`);
  }

  return (
    <ConfirmStart
      examId={exam.id}
      title={exam.title}
      subjectName={exam.subject.name}
      studentName={user.name}
      className={user.student.class?.name ?? "—"}
      questions={exam._count.questions}
      duration={exam.durationMinutes}
      startAt={exam.startAt}
      endAt={exam.endAt}
      isResume={existing?.status === "IN_PROGRESS"}
    />
  );
}
