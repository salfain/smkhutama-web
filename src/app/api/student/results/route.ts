import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { listResults } from "@/server/modules/cbt/student";
import { toResult } from "@/server/modules/cbt/dto";

// Endpoint versi lama. Penggantinya: GET /api/v1/cbt/student/results.
export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student" }, { status: 400 });

  const attempts = await listResults(student.id);
  return NextResponse.json(attempts.map(toResult));
}
