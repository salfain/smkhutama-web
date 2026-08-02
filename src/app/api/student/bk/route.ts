import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { getStudentBkSummary } from "@/server/modules/bk/service";
import { toStudentSummary } from "@/server/modules/bk/dto";

// Endpoint versi lama. Penggantinya: /api/v1/bk/student/summary.
export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student profile" }, { status: 400 });

  const summary = await getStudentBkSummary(student.id);
  return NextResponse.json(toStudentSummary(summary));
}
