import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PrintQuestionsClient } from "./PrintQuestionsClient";

export const dynamic = "force-dynamic";

async function getExamWithQuestions(examId: string) {
  const [exam, school] = await Promise.all([
    prisma.exam.findUnique({
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
                    id: true, optionLabel: true,
                    optionText: true, isCorrect: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.schoolProfile.findFirst(),
  ]);
  return { exam, school };
}

export default async function PrintQuestionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ showKey?: string }>;
}) {
  await requireAuth("ADMIN");
  const { id: examId } = await params;
  const sp = await searchParams;
  const showKey = sp.showKey === "1";

  const { exam, school } = await getExamWithQuestions(examId);
  if (!exam) notFound();

  const data = {
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
      mediaUrl: eq.question.mediaUrl ?? null,
      explanation: eq.question.explanation ?? null,
      options: eq.question.options,
    })),
    school: school ? {
      name: school.name,
      address: school.address,
      npsn: school.npsn,
    } : null,
  };

  return <PrintQuestionsClient data={data} showKey={showKey} examId={examId} />;
}
