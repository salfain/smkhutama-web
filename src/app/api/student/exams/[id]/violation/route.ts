import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { VIOLATION_LOCK_THRESHOLD, recordViolation } from "@/server/modules/cbt/exam-session";

/**
 * Endpoint versi lama — mobile melaporkan pelanggaran (misal siswa keluar
 * aplikasi). Server menambah counter dan mengunci attempt bila melewati
 * ambang batas.
 * Penggantinya: POST /api/v1/cbt/student/exams/{id}/violation.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student profile" }, { status: 400 });

  const { id: examId } = await params;
  const body = await req.json().catch(() => ({}));

  const result = await recordViolation({
    examId,
    studentId: student.id,
    userId: r.user.id,
    reason: body.reason,
    offlineCount: body.offlineCount,
  });

  if (result.state === "NO_ATTEMPT") {
    return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });
  }
  if (result.state === "FINISHED") {
    return NextResponse.json({
      locked: false,
      finished: true,
      violationCount: result.violationCount,
    });
  }
  if (result.state === "LOCKED") {
    return NextResponse.json({
      locked: true,
      violationCount: result.violationCount,
      lockReason: result.lockReason,
    });
  }

  return NextResponse.json({
    locked: result.locked,
    violationCount: result.violationCount,
    threshold: VIOLATION_LOCK_THRESHOLD,
    lockReason: result.lockReason,
  });
}
