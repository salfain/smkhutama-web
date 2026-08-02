import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { saveAnswer } from "@/server/modules/cbt/exam-session";

// Endpoint versi lama. Penggantinya: POST /api/v1/cbt/student/answers.
export async function POST(req: NextRequest) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student" }, { status: 400 });

  const { examId, questionId, selectedOptionId, answerText, isDoubtful } = await req.json();
  if (!examId || !questionId) {
    return NextResponse.json({ error: "examId dan questionId wajib" }, { status: 400 });
  }

  const result = await saveAnswer(examId, student.id, {
    questionId,
    selectedOptionId,
    answerText,
    isDoubtful,
  });

  if (result === "NO_ATTEMPT") {
    return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });
  }
  if (result === "ALREADY_SUBMITTED") {
    return NextResponse.json({ error: "Ujian sudah disubmit" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
