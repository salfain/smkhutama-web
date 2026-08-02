import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { listEssayAnswers } from "@/server/modules/cbt/teacher";
import { toEssayAnswer } from "@/server/modules/cbt/dto";

// Endpoint versi lama. Penggantinya: /api/v1/cbt/teacher/essay-grading.
export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "TEACHER");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const teacher = r.user.teacher;
  if (!teacher) return NextResponse.json({ error: "No teacher" }, { status: 400 });

  const answers = await listEssayAnswers(teacher.id, "SAVED_ASC");
  return NextResponse.json(answers.map(toEssayAnswer));
}
