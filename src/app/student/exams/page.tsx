import { requireAuth } from "@/lib/session";
import { listExams } from "@/server/modules/cbt/student";
import { StudentExamsList } from "./StudentExamsList";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentExamsPage() {
  const c = await cookies();
  const system = c.get("student-system")?.value || "CBT";
  if (system === "SIBIKONS") redirect("/student/bk");

  const user = await requireAuth("STUDENT");
  if (!user.student) return null;

  const examsRaw = await listExams(user.student);

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
