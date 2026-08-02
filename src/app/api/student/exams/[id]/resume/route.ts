import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { buildMobileExamPayload } from "@/lib/mobile-exam";
import { getAttemptWithAnswers, getExamWithQuestions } from "@/server/modules/cbt/exam-session";
import { toResumeWithoutAttempt } from "@/server/modules/cbt/dto";

// Endpoint versi lama.
// Penggantinya: GET /api/v1/cbt/student/exams/{id}/resume.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student profile" }, { status: 400 });

  const { id: examId } = await params;
  const [exam, attempt] = await Promise.all([
    getExamWithQuestions(examId),
    getAttemptWithAnswers(examId, student.id),
  ]);

  if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
  if (!attempt) return NextResponse.json(toResumeWithoutAttempt(exam));

  return NextResponse.json(buildMobileExamPayload(exam, attempt));
}
