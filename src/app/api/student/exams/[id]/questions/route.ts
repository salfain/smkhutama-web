import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { buildMobileExamPayload } from "@/lib/mobile-exam";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student" }, { status: 400 });

  const { id: examId } = await params;

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      subject: { select: { code: true, name: true } },
      questions: {
        orderBy: { orderNumber: "asc" },
        include: { question: { include: { options: { orderBy: { orderNumber: "asc" } } } } },
      },
    },
  });
  if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });

  const attempt = await prisma.studentExamAttempt.findUnique({
    where: { examId_studentId: { examId, studentId: student.id } },
    include: { answers: { select: { questionId: true, selectedOptionId: true, answerText: true, isDoubtful: true, savedAt: true } } },
  });
  if (!attempt) return NextResponse.json({ error: "Belum mulai ujian" }, { status: 400 });
  return NextResponse.json(buildMobileExamPayload(exam, attempt));
}
