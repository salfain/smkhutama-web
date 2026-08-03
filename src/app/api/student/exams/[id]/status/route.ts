import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { findAttempt } from "@/server/modules/cbt/exam-session";
import { toAttemptStatus } from "@/server/modules/cbt/dto";

/**
 * Endpoint versi lama — mobile cek apakah attempt masih terkunci atau sudah
 * dibuka pengawas. Penggantinya: GET /api/v1/cbt/student/exams/{id}/status.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student profile" }, { status: 400 });

  const { id: examId } = await params;
  const attempt = await findAttempt(examId, student.id);
  if (!attempt) return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });

  return NextResponse.json(toAttemptStatus(attempt));
}
