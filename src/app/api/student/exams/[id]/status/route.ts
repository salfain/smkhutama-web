import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

/**
 * Mobile cek status attempt — apakah masih terkunci atau sudah dibuka pengawas.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student profile" }, { status: 400 });

  const { id: examId } = await params;
  const a = await prisma.studentExamAttempt.findUnique({
    where: { examId_studentId: { examId, studentId: student.id } },
  });
  if (!a) return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });

  return NextResponse.json({
    isLocked: a.isLocked,
    violationCount: a.violationCount,
    status: a.status, // kalau sudah AUTO_SUBMITTED / SUBMITTED, mobile arahkan ke finish
    lockReason: a.lockReason,
  });
}
