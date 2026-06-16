import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { canTeacherCreateToken } from "@/lib/exam-permissions";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "TEACHER");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const teacher = r.user.teacher;
  if (!teacher) return NextResponse.json({ error: "No teacher" }, { status: 400 });

  const { id: examId } = await params;
  const body = await req.json().catch(() => ({}));
  const durationMinutes = Number(body.durationMinutes ?? 60);

  const exam = await prisma.exam.findFirst({
    where: { id: examId, teacherId: teacher.id },
    include: { subject: { select: { code: true } } },
  });
  if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
  if (!canTeacherCreateToken(exam.examType)) {
    return NextResponse.json({ error: `Token ${exam.examType} hanya bisa dibuat Admin` }, { status: 403 });
  }

  const prefix = exam.subject.code;
  let token = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
  let tries = 0;
  while (tries < 10) {
    const exists = await prisma.examToken.findUnique({ where: { token } });
    if (!exists) break;
    token = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    tries++;
  }

  const expiredAt = new Date(Date.now() + durationMinutes * 60000);
  const created = await prisma.examToken.create({
    data: { examId, token, expiredAt, isActive: true },
  });

  return NextResponse.json({ success: true, token: created.token, expiredAt });
}
