import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/exams/[id]/print-questions
 * Mengembalikan semua soal dalam paket ujian beserta opsi jawaban.
 * Digunakan untuk halaman cetak soal (print/PDF).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth();
  if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const { id: examId } = await params;

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      subject: { select: { name: true, code: true } },
      teacher: { include: { user: { select: { name: true } } } },
      academicYear: { select: { year: true, semester: true } },
      classes: { include: { class: { select: { name: true } } } },
      questions: {
        orderBy: { orderNumber: "asc" },
        include: {
          question: {
            include: {
              options: {
                orderBy: { orderNumber: "asc" },
                select: {
                  id: true,
                  optionLabel: true,
                  optionText: true,
                  isCorrect: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });

  // Guru hanya boleh akses ujian miliknya
  if (user.role === "TEACHER" && user.teacher && exam.teacherId !== user.teacher.id) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const school = await prisma.schoolProfile.findFirst();

  return NextResponse.json({
    exam: {
      id: exam.id,
      title: exam.title,
      examType: exam.examType,
      durationMinutes: exam.durationMinutes,
      startAt: exam.startAt,
      passingScore: exam.passingScore,
      subject: exam.subject,
      teacherName: exam.teacher.user.name,
      academicYear: exam.academicYear,
      classNames: exam.classes.map((c) => c.class.name),
    },
    questions: exam.questions.map((eq, idx) => ({
      no: idx + 1,
      id: eq.question.id,
      questionText: eq.question.questionText,
      questionType: eq.question.questionType,
      mediaType: eq.question.mediaType,
      mediaUrl: eq.question.mediaUrl,
      explanation: eq.question.explanation,
      options: eq.question.options,
    })),
    school: school ? {
      name: school.name,
      address: school.address,
      npsn: school.npsn,
    } : null,
  });
}
