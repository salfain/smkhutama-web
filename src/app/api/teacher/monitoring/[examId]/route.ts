import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { findTeacherExam, listAttemptsForExam } from "@/server/modules/cbt/monitoring";
import { toMonitoring } from "@/server/modules/cbt/dto";

// Endpoint versi lama.
// Penggantinya: GET /api/v1/cbt/teacher/monitoring/{examId}.
export async function GET(req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
  const r = await requireApiAuth(req, "TEACHER");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const teacher = r.user.teacher;
  if (!teacher) return NextResponse.json({ error: "No teacher" }, { status: 400 });

  const { examId } = await params;
  const exam = await findTeacherExam(examId, teacher.id);
  if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });

  const attempts = await listAttemptsForExam(examId);
  return NextResponse.json(toMonitoring(exam, attempts));
}
