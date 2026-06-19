import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student" }, { status: 400 });

  const { examId } = await req.json();
  if (!examId) return NextResponse.json({ error: "examId wajib" }, { status: 400 });

  const existing = await prisma.studentExamAttempt.findUnique({
    where: { examId_studentId: { examId, studentId: student.id } },
  });

  if (existing) {
    if (existing.status === "SUBMITTED" || existing.status === "AUTO_SUBMITTED") {
      return NextResponse.json({ error: "Ujian sudah dikerjakan" }, { status: 400 });
    }
    if (!existing.startedAt) {
      await prisma.studentExamAttempt.update({
        where: { id: existing.id },
        data: { startedAt: new Date(), status: "IN_PROGRESS", loginStatus: true },
      });
      await logAudit({
        userId: r.user.id,
        action: "API_START_EXAM_ATTEMPT",
        entity: "studentExamAttempt",
        entityId: existing.id,
        details: { examId, studentId: student.id },
      });
    }
    return NextResponse.json({ success: true, attemptId: existing.id });
  }

  const attempt = await prisma.studentExamAttempt.create({
    data: { examId, studentId: student.id, startedAt: new Date(), status: "IN_PROGRESS", loginStatus: true },
  });
  await logAudit({
    userId: r.user.id,
    action: "API_START_EXAM_ATTEMPT",
    entity: "studentExamAttempt",
    entityId: attempt.id,
    details: { examId, studentId: student.id },
  });

  return NextResponse.json({ success: true, attemptId: attempt.id });
}
