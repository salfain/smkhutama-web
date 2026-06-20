import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, BarChart3, Users, CheckCircle2, XCircle } from "lucide-react";
import { AnalysisExamSelector } from "./AnalysisExamSelector";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analisis Soal" };

function diffBadge(d: number) {
  if (d >= 0.7) return { label: "Mudah",  color: "bg-green-100 text-green-700 border-green-200" };
  if (d >= 0.4) return { label: "Sedang", color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
  return        { label: "Sulit",  color: "bg-red-100 text-red-700 border-red-200" };
}

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ examId?: string }>;
}) {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return null;

  // Ambil semua ujian CLOSED milik guru ini
  const allExams = await prisma.exam.findMany({
    where: { teacherId: user.teacher.id, status: "CLOSED" },
    orderBy: { endAt: "desc" },
    include: {
      subject: { select: { code: true, name: true } },
      _count: { select: { attempts: true } },
    },
  });

  const { examId } = await searchParams;
  // Pilih ujian: dari URL param, atau ujian terbaru
  const selectedExamId = examId ?? allExams[0]?.id ?? null;
  const exam = allExams.find((e) => e.id === selectedExamId) ?? allExams[0] ?? null;

  const examOptions = allExams.map((e) => ({
    id: e.id,
    title: e.title,
    subjectCode: e.subject.code,
    endAt: e.endAt,
    attemptCount: e._count.attempts,
  }));

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!exam) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Analisis Soal</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Statistik tingkat kesulitan dan performa soal per ujian</p>
        </div>
        <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
          <BarChart3 className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-slate-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada ujian yang selesai.</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Tutup ujian di halaman Paket Ujian agar bisa dianalisis.</p>
        </div>
      </div>
    );
  }

  // ── Hitung statistik per soal ────────────────────────────────────────────
  const examFull = await prisma.exam.findUnique({
    where: { id: exam.id },
    include: {
      subject: { select: { code: true, name: true } },
      questions: {
        orderBy: { orderNumber: "asc" },
        include: { question: { select: { id: true, questionText: true, questionType: true } } },
      },
      _count: { select: { attempts: true } },
    },
  });

  if (!examFull) return null;

  const questionIds = examFull.questions.map((q) => q.questionId);
  const answers = await prisma.studentAnswer.findMany({
    where: {
      questionId: { in: questionIds },
      attempt: { examId: exam.id, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
    },
    select: { questionId: true, isCorrect: true },
  });

  const totalParticipants = examFull._count.attempts;

  const stats = examFull.questions.map((eq, idx) => {
    const all = answers.filter((a) => a.questionId === eq.questionId);
    const correct = all.filter((a) => a.isCorrect === true).length;
    const wrong   = all.filter((a) => a.isCorrect === false).length;
    const total   = totalParticipants || 1; // pakai total peserta bukan jawaban masuk
    const difficulty = correct / total;
    return {
      no: idx + 1,
      questionText: eq.question.questionText,
      questionType: eq.question.questionType,
      correct, wrong, total: totalParticipants, difficulty,
    };
  });

  const sorted = [...stats].sort((a, b) => a.difficulty - b.difficulty);
  const hardest  = sorted[0];
  const easiest  = sorted[sorted.length - 1];
  const avgDiff  = stats.length > 0
    ? stats.reduce((s, q) => s + q.difficulty, 0) / stats.length
    : 0;

  // Distribusi tingkat kesulitan
  const easy   = stats.filter((q) => q.difficulty >= 0.7).length;
  const medium = stats.filter((q) => q.difficulty >= 0.4 && q.difficulty < 0.7).length;
  const hard   = stats.filter((q) => q.difficulty < 0.4).length;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Analisis Soal</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Statistik tingkat kesulitan dan performa soal per ujian
        </p>
      </div>

      {/* Dropdown pilih ujian */}
      <div className="mb-6">
        <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Pilih Ujian
        </label>
        <AnalysisExamSelector exams={examOptions} selectedId={exam.id} />
      </div>

      {/* Info ujian terpilih */}
      <div className="mb-6 rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-base">{examFull.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {examFull.subject.code} · {examFull.subject.name}
            </p>
          </div>
          <div className="flex gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4" />
              <span><strong>{totalParticipants}</strong> peserta</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <BarChart3 className="h-4 w-4" />
              <span><strong>{stats.length}</strong> soal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Rata-rata Benar",  value: `${Math.round(avgDiff * 100)}%`,  color: "text-blue-600",   sub: "dari seluruh soal" },
          { label: "Soal Mudah",       value: `${easy}`,                          color: "text-green-600",  sub: `${Math.round(easy / stats.length * 100)}% dari total` },
          { label: "Soal Sedang",      value: `${medium}`,                        color: "text-yellow-600", sub: `${Math.round(medium / stats.length * 100)}% dari total` },
          { label: "Soal Sulit",       value: `${hard}`,                          color: "text-red-600",    sub: `${Math.round(hard / stats.length * 100)}% dari total` },
        ].map((s) => (
          <Card key={s.label} className="border shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Soal paling sulit & mudah */}
      {(hardest || easiest) && (
        <div className="mb-6 grid gap-3 md:grid-cols-2">
          {hardest && (
            <div className="rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-950/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">Soal Tersulit (#{hardest.no})</span>
              </div>
              <p className="text-sm text-red-900 dark:text-red-200 line-clamp-2">{hardest.questionText}</p>
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{hardest.correct}/{hardest.total} peserta benar ({Math.round(hardest.difficulty * 100)}%)</p>
            </div>
          )}
          {easiest && (
            <div className="rounded-xl border border-green-100 dark:border-green-900/30 bg-green-50 dark:bg-green-950/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">Soal Termudah (#{easiest.no})</span>
              </div>
              <p className="text-sm text-green-900 dark:text-green-200 line-clamp-2">{easiest.questionText}</p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">{easiest.correct}/{easiest.total} peserta benar ({Math.round(easiest.difficulty * 100)}%)</p>
            </div>
          )}
        </div>
      )}

      {/* Tabel detail per soal */}
      <Card className="border shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Detail Analisis per Soal
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-slate-800 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-950">
                  <th className="text-left px-4 py-3 font-semibold w-10">No</th>
                  <th className="text-left px-4 py-3 font-semibold">Teks Soal</th>
                  <th className="text-center px-4 py-3 font-semibold">
                    <span className="flex items-center justify-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />Benar</span>
                  </th>
                  <th className="text-center px-4 py-3 font-semibold">
                    <span className="flex items-center justify-center gap-1"><XCircle className="h-3.5 w-3.5 text-red-400" />Salah</span>
                  </th>
                  <th className="text-center px-4 py-3 font-semibold">% Benar</th>
                  <th className="text-center px-4 py-3 font-semibold">Tingkat</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {stats.map((q) => {
                  const badge = diffBadge(q.difficulty);
                  const Icon = q.difficulty >= 0.7 ? TrendingUp : q.difficulty >= 0.4 ? Minus : TrendingDown;
                  const pct = Math.round(q.difficulty * 100);
                  return (
                    <tr key={q.no} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{q.no}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-sm">
                        <p className="line-clamp-2 text-sm leading-snug">{q.questionText}</p>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-green-600 dark:text-green-400">{q.correct}</td>
                      <td className="px-4 py-3 text-center font-semibold text-red-500 dark:text-red-400">{q.wrong}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300 font-medium">
                            <Icon className="h-3 w-3" />{pct}%
                          </span>
                          <div className="w-16 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${q.difficulty >= 0.7 ? "bg-green-400" : q.difficulty >= 0.4 ? "bg-yellow-400" : "bg-red-400"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={`text-xs hover:opacity-100 ${badge.color}`}>{badge.label}</Badge>
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
