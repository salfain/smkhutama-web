import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TokenForm } from "./TokenForm";

export const dynamic = "force-dynamic";

export default async function TokenPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth("STUDENT");
  if (!user.student) redirect("/login");
  const { id } = await params;

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: { subject: { select: { code: true, name: true } } },
  });
  if (!exam) notFound();

  // Cek apakah sudah pernah submit
  const existing = await prisma.studentExamAttempt.findUnique({
    where: { examId_studentId: { examId: id, studentId: user.student.id } },
  });

  if (existing && (existing.status === "SUBMITTED" || existing.status === "AUTO_SUBMITTED")) {
    redirect(`/student/exams/${id}/finish`);
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link href="/student/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />Kembali ke dashboard
        </Link>
        <TokenForm
          examId={exam.id}
          examTitle={exam.title}
          subjectCode={exam.subject.code}
          startAt={exam.startAt}
          endAt={exam.endAt}
        />
      </div>
    </div>
  );
}
