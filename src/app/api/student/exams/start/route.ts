import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import {
  beginAttempt,
  checkExamAccess,
  checkExamToken,
  findAttempt,
  findExamWithClasses,
  isSubmitted,
} from "@/server/modules/cbt/exam-session";
import {
  EXAM_ACCESS_MESSAGES,
  EXAM_ACCESS_STATUS,
  EXAM_TOKEN_MESSAGES,
} from "@/server/modules/cbt/http-errors";

// Endpoint versi lama. Penggantinya: POST /api/v1/cbt/student/exams/start.
export async function POST(req: NextRequest) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student" }, { status: 400 });

  const { examId, token: tokenInput } = await req.json();
  if (!examId) return NextResponse.json({ error: "examId wajib" }, { status: 400 });

  const now = new Date();
  const exam = await findExamWithClasses(examId);
  const accessCode = checkExamAccess(exam, student.classId, now);
  if (accessCode) {
    return NextResponse.json(
      { error: EXAM_ACCESS_MESSAGES[accessCode] },
      { status: EXAM_ACCESS_STATUS[accessCode] }
    );
  }

  const existing = await findAttempt(examId, student.id);
  if (existing && isSubmitted(existing.status)) {
    return NextResponse.json({ error: "Ujian sudah dikerjakan" }, { status: 400 });
  }

  // Token hanya diminta saat ujian benar-benar dimulai; attempt yang sudah
  // berjalan boleh dilanjutkan tanpa token baru.
  if (!existing?.startedAt) {
    const tokenCode = await checkExamToken(examId, tokenInput, now);
    if (tokenCode) {
      return NextResponse.json({ error: EXAM_TOKEN_MESSAGES[tokenCode] }, { status: 400 });
    }
  }

  const result = await beginAttempt({
    examId,
    studentId: student.id,
    userId: r.user.id,
    auditAction: "API_START_EXAM_ATTEMPT",
  });
  if (result.status === "ALREADY_SUBMITTED") {
    return NextResponse.json({ error: "Ujian sudah dikerjakan" }, { status: 400 });
  }

  return NextResponse.json({ success: true, attemptId: result.attemptId });
}
