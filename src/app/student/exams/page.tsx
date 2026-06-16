import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { StudentExamsList } from "./StudentExamsList";

export const dynamic = "force-dynamic";

export default async function StudentExamsPage() {
  const user = await requireAuth("STUDENT");
  if (!user.student) return null;

  const classId = user.student.classId;

  const examsRaw = await prisma.exam.findMany({
    where: classId ? { classes: { some: { classId } } } : {},
    orderBy: { startAt: "desc" },
    include: {
      subject: { select: { code: true, name: true } },
      _count: { select: { questions: true } },
      attempts: { where: { studentId: user.student.id }, take: 1 },
    },
  });

  const exams = examsRaw.map((e) => ({
    id: e.id,
    title: e.title,
    examType: e.examType,
    status: e.status,
    startAt: e.startAt,
    endAt: e.endAt,
    durationMinutes: e.durationMinutes,
    subject: e.subject,
    _count: e._count,
    attempt: e.attempts[0]
      ? { status: e.attempts[0].status }
      : null,
  }));

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Ujian Saya</h1>
        <p className="text-sm text-gray-500">{user.name} · {user.student.class?.name ?? "—"}</p>
      </div>
      <StudentExamsList exams={exams} />
    </div>
  );
}
