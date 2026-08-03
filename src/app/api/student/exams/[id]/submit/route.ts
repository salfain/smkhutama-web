import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { submitAttempt } from "@/server/modules/cbt/exam-session";

// Endpoint versi lama.
// Penggantinya: POST /api/v1/cbt/student/exams/{id}/submit.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student" }, { status: 400 });

  const { id: examId } = await params;
  const body = await req.json().catch(() => ({}));
  const isAuto = body.auto === true;

  const result = await submitAttempt({
    examId,
    studentId: student.id,
    userId: r.user.id,
    isAuto,
    auditAction: isAuto ? "API_AUTO_SUBMIT_EXAM" : "API_SUBMIT_EXAM",
  });

  if (result.state === "NO_ATTEMPT") {
    return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ success: true, score: result.score });
}
