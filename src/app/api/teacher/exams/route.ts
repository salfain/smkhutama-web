import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { listTeacherExams } from "@/server/modules/cbt/teacher";
import { toTeacherExam } from "@/server/modules/cbt/dto";

// Endpoint versi lama. Penggantinya: /api/v1/cbt/teacher/exams.
export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "TEACHER");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const teacher = r.user.teacher;
  if (!teacher) return NextResponse.json({ error: "No teacher" }, { status: 400 });

  const exams = await listTeacherExams(teacher.id);
  return NextResponse.json(exams.map(toTeacherExam));
}
