import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student" }, { status: 400 });

  const { examId, token: tokenInput } = await req.json();
  if (!examId || !tokenInput) {
    return NextResponse.json({ error: "examId dan token wajib" }, { status: 400 });
  }

  const trimmed = String(tokenInput).trim().toUpperCase();
  const exam = await prisma.exam.findUnique({
    where: { id: examId }, include: { classes: true },
  });
  if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
  if (exam.status !== "ACTIVE") return NextResponse.json({ error: "Ujian belum aktif" }, { status: 400 });

  const now = new Date();
  if (now < exam.startAt) return NextResponse.json({ error: "Ujian belum dimulai" }, { status: 400 });
  if (now > exam.endAt) return NextResponse.json({ error: "Ujian sudah berakhir" }, { status: 400 });

  if (exam.classes.length > 0 && !exam.classes.some((c) => c.classId === student.classId)) {
    return NextResponse.json({ error: "Anda bukan peserta ujian ini" }, { status: 403 });
  }

  const token = await prisma.examToken.findFirst({
    where: { examId, token: trimmed, isActive: true },
  });
  if (!token) return NextResponse.json({ error: "Token tidak valid" }, { status: 400 });
  if (token.expiredAt < now) return NextResponse.json({ error: "Token kadaluarsa" }, { status: 400 });

  return NextResponse.json({ success: true });
}
