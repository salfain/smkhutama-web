import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { QuestionSetDetailView } from "@/components/question-sets/QuestionSetDetailView";

export const dynamic = "force-dynamic";

export default async function TeacherQuestionSetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) notFound();

  const { id } = await params;
  const questionSet = await prisma.questionSet.findFirst({
    where: { id, ownerTeacherId: user.teacher.id },
    include: {
      subject: { select: { code: true, name: true } },
      ownerTeacher: { include: { user: { select: { name: true } } } },
      questions: {
        orderBy: { createdAt: "asc" },
        include: { options: { orderBy: { orderNumber: "asc" } } },
      },
      _count: { select: { exams: true } },
    },
  });

  if (!questionSet) notFound();

  return (
    <QuestionSetDetailView
      questionSet={questionSet}
      backHref="/teacher/question-sets"
      backLabel="Kembali ke Paket Bank Soal"
    />
  );
}
