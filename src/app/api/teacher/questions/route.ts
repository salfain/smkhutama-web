import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { listTeacherQuestions } from "@/server/modules/cbt/teacher";

// Endpoint versi lama. Penggantinya: /api/v1/cbt/teacher/questions.
export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "TEACHER");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const teacher = r.user.teacher;
  if (!teacher) return NextResponse.json({ error: "No teacher" }, { status: 400 });

  return NextResponse.json(await listTeacherQuestions(teacher.id));
}
