import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student" }, { status: 400 });

  const { examId, token: tokenInput } = await req.json();
  if (!examId) return NextResponse.json({ error: "examId wajib" }, { status: 400 });

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { classes: true },
  });
  if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
  if (exam.status !== "ACTIVE") return NextResponse.json({ error: "Ujian belum aktif" }, { status: 400 });

  const now = new Date();
  if (now < exam.startAt) return NextResponse.json({ error: "Ujian belum dimulai" }, { status: 400 });
  if (now > exam.endAt) return NextResponse.json({ error: "Ujian sudah berakhir" }, { status: 400 });

  if (exam.classes.length > 0 && !exam.classes.some((c) => c.classId === student.classId)) {
    return NextResponse.json({ error: "Anda bukan peserta ujian ini" }, { status: 403 });
  }

  async function validateStartToken() {
    const trimmedToken = String(tokenInput ?? "").trim().toUpperCase();
    if (!trimmedToken) return "Token wajib untuk memulai ujian";
    const token = await prisma.examToken.findFirst({
      where: { examId, token: trimmedToken, isActive: true },
    });
    if (!token) return "Token tidak valid";
    if (token.expiredAt < now) return "Token kadaluarsa";
    return null;
  }

  const existing = await prisma.studentExamAttempt.findUnique({
    where: { examId_studentId: { examId, studentId: student.id } },
  });

  if (existing) {
    if (existing.status === "SUBMITTED" || existing.status === "AUTO_SUBMITTED") {
      return NextResponse.json({ error: "Ujian sudah dikerjakan" }, { status: 400 });
    }
    if (!existing.startedAt) {
      const tokenError = await validateStartToken();
      if (tokenError) return NextResponse.json({ error: tokenError }, { status: 400 });
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

  const tokenError = await validateStartToken();
  if (tokenError) return NextResponse.json({ error: tokenError }, { status: 400 });

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
