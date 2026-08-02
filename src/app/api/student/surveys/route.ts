import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { listSurveysForStudent } from "@/server/modules/bk/surveys";
import { toStudentSurvey } from "@/server/modules/bk/dto";

// Endpoint versi lama. Penggantinya: /api/v1/bk/student/surveys.
export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const studentId = r.user.student?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 400 });
  }

  const surveys = await listSurveysForStudent(studentId);
  return NextResponse.json(surveys.map(toStudentSurvey));
}
