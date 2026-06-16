import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TeacherResultsClient } from "./TeacherResultsClient";

export const dynamic = "force-dynamic";

export default async function TeacherResultsPage() {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return null;

  const exams = await prisma.exam.findMany({
    where: { teacherId: user.teacher.id, status: { in: ["CLOSED", "ACTIVE"] } },
    orderBy: { startAt: "desc" },
    include: {
      subject: { select: { code: true } },
      attempts: {
        where: { status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
        include: {
          student: {
            include: {
              user: { select: { name: true } },
              class: { select: { name: true } },
            },
          },
        },
        orderBy: { score: "desc" },
      },
    },
  });

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
        class: a.student.class?.name ?? "—",
      },
    })),
  }));

  return <TeacherResultsClient exams={data} />;
}
