import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { buildMobileExamPayload } from "@/lib/mobile-exam";
import { getAttemptWithAnswers, getExamWithQuestions } from "@/server/modules/cbt/exam-session";

// Endpoint versi lama.
// Penggantinya: GET /api/v1/cbt/student/exams/{id}/questions.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student" }, { status: 400 });

  const { id: examId } = await params;
  const exam = await getExamWithQuestions(examId);
  if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });

  const attempt = await getAttemptWithAnswers(examId, student.id);
  if (!attempt) return NextResponse.json({ error: "Belum mulai ujian" }, { status: 400 });

  return NextResponse.json(buildMobileExamPayload(exam, attempt));
}
