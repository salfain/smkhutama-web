import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Trophy, XCircle, Minus, ArrowRight, Home, Hourglass } from "lucide-react";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FinishPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth("STUDENT");
  if (!user.student) redirect("/login");
  const { id } = await params;

  const attempt = await prisma.studentExamAttempt.findUnique({
    where: { examId_studentId: { examId: id, studentId: user.student.id } },
    include: {
      exam: { include: { subject: { select: { code: true, name: true } } } },
      answers: { select: { isCorrect: true, selectedOptionId: true, answerText: true } },
    },
  });
  if (!attempt) notFound();

  const totalQuestions = await prisma.examQuestion.count({ where: { examId: id } });
  const correct = attempt.answers.filter((a) => a.isCorrect === true).length;
  const wrong = attempt.answers.filter((a) => a.isCorrect === false).length;
  const empty = totalQuestions - attempt.answers.filter((a) => a.selectedOptionId || a.answerText).length;

  const isWaiting = attempt.score === null;
  const passed = !isWaiting && attempt.exam.passingScore !== null && (attempt.score ?? 0) >= attempt.exam.passingScore;
  const score = attempt.score;

  const showResult = attempt.exam.showResult;

  return (
    <div className="mx-auto max-w-lg p-4 md:p-6">
      <div className={`mb-5 rounded-2xl p-6 text-center text-white ${
        isWaiting ? "bg-gradient-to-br from-gray-500 to-gray-600"
        : passed ? "bg-gradient-to-br from-green-500 to-emerald-600"
        : "bg-gradient-to-br from-orange-500 to-red-500"
      }`}>
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
          {isWaiting ? <Hourglass className="h-8 w-8" /> : passed ? <Trophy className="h-8 w-8" /> : <CheckCircle className="h-8 w-8" />}
        </div>
        <h1 className="font-heading text-2xl font-bold">Ujian Selesai!</h1>
        <p className="mt-1 text-white/80 text-sm">{attempt.exam.title} · {attempt.exam.subject.name}</p>
        {isWaiting ? (
          <>
            <p className="mt-4 text-2xl font-bold">Menunggu Koreksi</p>
            <p className="text-white/70 text-sm">Soal esai sedang dikoreksi guru</p>
          </>
        ) : showResult ? (
          <>
            <div className="mt-4 text-6xl font-bold">{score}</div>
            <p className="text-white/70 text-sm">dari 100</p>
            {attempt.exam.passingScore !== null && (
              <Badge className="mt-3 bg-white/20 text-white border-white/30 hover:bg-white/20">
                {passed ? "✓ LULUS" : "✗ TIDAK LULUS"} (KKM: {attempt.exam.passingScore})
              </Badge>
            )}
          </>
        ) : (
          <p className="mt-4 text-sm text-white/80">Nilai akan diumumkan oleh guru</p>
        )}
      </div>

      {showResult && !isWaiting && (
        <div className="mb-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
            <CheckCircle className="mx-auto mb-1 h-5 w-5 text-green-500" />
            <p className="text-2xl font-bold text-green-600">{correct}</p>
            <p className="text-xs text-gray-500">Benar</p>
          </div>
          <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
            <XCircle className="mx-auto mb-1 h-5 w-5 text-red-500" />
            <p className="text-2xl font-bold text-red-500">{wrong}</p>
            <p className="text-xs text-gray-500">Salah</p>
          </div>
          <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
            <Minus className="mx-auto mb-1 h-5 w-5 text-gray-400" />
            <p className="text-2xl font-bold text-gray-500">{empty}</p>
            <p className="text-xs text-gray-500">Kosong</p>
          </div>
        </div>
      )}

      <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Peserta</span><span className="font-medium">{user.name}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Kelas</span><span className="font-medium">{user.student.class?.name ?? "—"}</span></div>
        {attempt.submittedAt && (
          <div className="flex justify-between"><span className="text-gray-500">Waktu Submit</span><span className="font-medium">{new Date(attempt.submittedAt).toLocaleString("id-ID")}</span></div>
        )}
        <div className="flex justify-between"><span className="text-gray-500">Total Soal</span><span className="font-medium">{totalQuestions}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-medium">{attempt.status === "AUTO_SUBMITTED" ? "Auto Submit" : "Submit"}</span></div>
      </div>

      <div className="flex flex-col gap-2">
        <Link href="/student/results">
          <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
            Lihat Riwayat Nilai <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/student/dashboard">
          <Button variant="outline" className="w-full gap-2">
            <Home className="h-4 w-4" />Kembali ke Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
