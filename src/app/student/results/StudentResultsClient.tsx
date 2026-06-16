"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, CheckCircle, XCircle, Eye } from "lucide-react";
import { AnswerReviewDialog } from "@/components/AnswerReviewDialog";

type Attempt = {
  id: string;
  score: number | null;
  submittedAt: string | null;
  exam: {
    title: string;
    showResult: boolean;
    passingScore: number | null;
    subject: { code: string; name: string };
  };
  correct: number;
  wrong: number;
  empty: number;
};

export function StudentResultsClient({
  attempts, studentName, className,
}: { attempts: Attempt[]; studentName: string; className: string }) {
  const [reviewAttemptId, setReviewAttemptId] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const valid = attempts.filter((a) => a.score !== null);
  const avg = valid.length > 0
    ? Math.round(valid.reduce((s, a) => s + (a.score ?? 0), 0) / valid.length) : 0;
  const passed = attempts.filter((a) =>
    a.exam.passingScore !== null && (a.score ?? 0) >= a.exam.passingScore
  ).length;
  const failed = attempts.filter((a) =>
    a.exam.passingScore !== null && (a.score ?? 0) < a.exam.passingScore
  ).length;

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Riwayat Nilai</h1>
        <p className="text-sm text-gray-500">{studentName} · {className}</p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
          <Trophy className="mx-auto mb-1 h-5 w-5 text-yellow-500" />
          <p className="text-2xl font-bold text-gray-900">{avg}</p>
          <p className="text-xs text-gray-500">Rata-rata</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
          <CheckCircle className="mx-auto mb-1 h-5 w-5 text-green-500" />
          <p className="text-2xl font-bold text-green-600">{passed}</p>
          <p className="text-xs text-gray-500">Lulus KKM</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
          <XCircle className="mx-auto mb-1 h-5 w-5 text-red-500" />
          <p className="text-2xl font-bold text-red-500">{failed}</p>
          <p className="text-xs text-gray-500">Tidak Lulus</p>
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <Trophy className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada nilai</p>
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.map((a) => {
            const isPassed = a.exam.passingScore !== null && (a.score ?? 0) >= a.exam.passingScore;
            const canView = a.exam.showResult;
            return (
              <div key={a.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{a.exam.title}</p>
                    <p className="text-xs text-gray-500">
                      {a.exam.subject.code} · {a.submittedAt && new Date(a.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {a.score !== null ? (
                      <>
                        <p className={`text-2xl font-bold ${(a.score ?? 0) >= 75 ? "text-green-600" : "text-red-500"}`}>{a.score}</p>
                        {a.exam.passingScore !== null && (
                          <Badge className={`text-xs mt-0.5 ${isPassed
                            ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                            : "bg-red-100 text-red-600 border-red-200 hover:bg-red-100"
                          }`}>
                            {isPassed ? "Lulus" : "Tidak Lulus"}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
                        Menunggu Koreksi
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <div className="flex gap-4 text-center text-xs text-gray-500">
                    <div><span className="font-semibold text-green-600">{a.correct}</span> Benar</div>
                    <div><span className="font-semibold text-red-500">{a.wrong}</span> Salah</div>
                    <div><span className="font-semibold text-gray-500">{a.empty}</span> Belum Dinilai</div>
                  </div>
                  {canView && (
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 h-7"
                      onClick={() => { setReviewAttemptId(a.id); setReviewOpen(true); }}>
                      <Eye className="h-3 w-3" />Lihat Jawaban
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnswerReviewDialog
        open={reviewOpen}
        onClose={() => { setReviewOpen(false); setReviewAttemptId(null); }}
        attemptId={reviewAttemptId}
        showCorrectAnswers={true}
      />
    </div>
  );
}
