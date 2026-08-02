import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { listExams } from "@/server/modules/cbt/student";
import { toExamListItem } from "@/server/modules/cbt/dto";

// Endpoint versi lama. Penggantinya: /api/v1/cbt/student/exams.
export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student profile" }, { status: 400 });

  const exams = await listExams(student);
  return NextResponse.json(exams.map(toExamListItem));
}
