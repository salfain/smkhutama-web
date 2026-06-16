import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { StudentResultsClient } from "./StudentResultsClient";

export const dynamic = "force-dynamic";

export default async function StudentResultsPage() {
  const user = await requireAuth("STUDENT");
  if (!user.student) return null;

  const attempts = await prisma.studentExamAttempt.findMany({
    where: {
      studentId: user.student.id,
      status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] },
    },
    orderBy: { submittedAt: "desc" },
    include: {
      exam: {
        include: {
          subject: { select: { code: true, name: true } },
        },
      },
      answers: { select: { isCorrect: true, score: true } },
    },
  });

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
