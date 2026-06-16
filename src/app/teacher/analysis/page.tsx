import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

function diffBadge(d: number) {
  if (d >= 0.7) return { label: "Mudah", color: "bg-green-100 text-green-700 border-green-200" };
  if (d >= 0.4) return { label: "Sedang", color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
  return { label: "Sulit", color: "bg-red-100 text-red-700 border-red-200" };
}

export default async function AnalysisPage() {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return null;

  const exams = await prisma.exam.findMany({
    where: { teacherId: user.teacher.id, status: "CLOSED" },
    orderBy: { startAt: "desc" },
    take: 1,
    include: {
      subject: { select: { code: true, name: true } },
      questions: { include: { question: { select: { id: true, questionText: true } } } },
      _count: { select: { attempts: true } },
    },
  });

  const exam = exams[0];

  if (!exam) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-gray-900">Analisis Soal</h1>
          <p className="text-sm text-gray-500">Belum ada ujian yang selesai untuk dianalisis</p>
        </div>
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <BarChart3 className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Tutup ujian dulu di halaman Paket Ujian agar bisa dianalisis.</p>
        </div>
      </div>
    );
  }

  // Hitung statistik per soal
  const questionIds = exam.questions.map((q) => q.questionId);
  const answers = await prisma.studentAnswer.findMany({
    where: { questionId: { in: questionIds }, attempt: { examId: exam.id, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } } },
    select: { questionId: true, isCorrect: true },
  });

  const stats = exam.questions.map((eq, idx) => {
    const all = answers.filter((a) => a.questionId === eq.questionId);
    const correct = all.filter((a) => a.isCorrect === true).length;
    const wrong = all.filter((a) => a.isCorrect === false).length;
    const total = all.length || 1;
    const difficulty = correct / total;
    return {
      no: idx + 1,
      questionText: eq.question.questionText,
      correct, wrong, total, difficulty,
    };
  });

  const sorted = [...stats].sort((a, b) => a.difficulty - b.difficulty);
  const hardest = sorted[0];
  const easiest = sorted[sorted.length - 1];
  const avgDifficulty = stats.length > 0
    ? stats.reduce((s, q) => s + q.difficulty, 0) / stats.length : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Analisis Soal</h1>
        <p className="text-sm text-gray-500">{exam.title} · {exam._count.attempts} peserta</p>
      </div>

      <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Total Soal", value: stats.length, color: "text-blue-600" },
          { label: "Rata-rata Benar", value: `${Math.round(avgDifficulty * 100)}%`, color: "text-purple-600" },
          { label: "Soal Termudah", value: easiest ? `#${easiest.no}` : "—", sub: easiest ? `${Math.round(easiest.difficulty * 100)}% benar` : "", color: "text-green-600" },
          { label: "Soal Tersulit", value: hardest ? `#${hardest.no}` : "—", sub: hardest ? `${Math.round(hardest.difficulty * 100)}% benar` : "", color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label} className="border shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
              {s.sub && <p className="text-xs text-gray-400">{s.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Detail Analisis per Soal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-gray-500">
                  <th className="text-left py-2 font-medium w-8">No</th>
                  <th className="text-left py-2 font-medium">Teks Soal</th>
                  <th className="text-center py-2 font-medium">Benar</th>
                  <th className="text-center py-2 font-medium">Salah</th>
                  <th className="text-center py-2 font-medium">% Benar</th>
                  <th className="text-center py-2 font-medium">Tingkat</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.map((q) => {
                  const badge = diffBadge(q.difficulty);
                  const Icon = q.difficulty >= 0.7 ? TrendingUp : q.difficulty >= 0.4 ? Minus : TrendingDown;
                  return (
                    <tr key={q.no}>
                      <td className="py-3 text-gray-500 font-mono">{q.no}</td>
                      <td className="py-3 text-gray-700 max-w-md"><p className="truncate">{q.questionText}</p></td>
                      <td className="py-3 text-center font-semibold text-green-600">{q.correct}</td>
                      <td className="py-3 text-center font-semibold text-red-500">{q.wrong}</td>
                      <td className="py-3 text-center text-gray-600">
                        <div className="inline-flex items-center gap-1">
                          <Icon className="h-3 w-3" />{(q.difficulty * 100).toFixed(0)}%
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <Badge className={`${badge.color} hover:${badge.color}`}>{badge.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
