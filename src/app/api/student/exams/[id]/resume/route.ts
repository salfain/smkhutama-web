import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { buildMobileExamPayload } from "@/lib/mobile-exam";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student profile" }, { status: 400 });

  const { id: examId } = await params;
  const [exam, attempt] = await Promise.all([
    prisma.exam.findUnique({
      where: { id: examId },
      include: {
        subject: { select: { code: true, name: true } },
        questions: {
          orderBy: { orderNumber: "asc" },
          include: { question: { include: { options: { orderBy: { orderNumber: "asc" } } } } },
        },
      },
    }),
    prisma.studentExamAttempt.findUnique({
      where: { examId_studentId: { examId, studentId: student.id } },
      include: {
        answers: {
          select: {
            questionId: true,
            selectedOptionId: true,
            answerText: true,
            isDoubtful: true,
            savedAt: true,
          },
        },
      },
    }),
  ]);

  if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
  if (!attempt) {
    return NextResponse.json({
      examId: exam.id,
      title: exam.title,
      subject: exam.subject,
      examType: exam.examType,
      status: exam.status,
      serverTime: new Date().toISOString(),
      attempt: null,
    });
  }

  return NextResponse.json(buildMobileExamPayload(exam, attempt));
}
