"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle, XCircle, Minus, AlertCircle, ChevronLeft, ChevronRight,
} from "lucide-react";

type QuestionReview = {
  number: number;
  questionText: string;
  questionType: string;
  options: { id: string; label: string; text: string; isCorrect: boolean }[];
  studentAnswer: {
    selectedOptionId: string | null;
    selectedLabel: string | null;
    selectedText: string | null;
    answerText: string | null;
    isCorrect: boolean | null;
    score: number | null;
    isDoubtful: boolean;
  } | null;
  correctOptionLabel: string | null;
  correctOptionText: string | null;
  explanation: string | null;
};

type ReviewData = {
  student: { name: string; class: string; nis: string | null };
  exam: { title: string; subject: { code: string; name: string }; passingScore: number | null };
  score: number | null;
  status: string;
  submittedAt: string | null;
  questions: QuestionReview[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  attemptId: string | null;
  showCorrectAnswers?: boolean; // false = untuk siswa saat showResult=false
};

export function AnswerReviewDialog({ open, onClose, attemptId, showCorrectAnswers = true }: Props) {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);

  useEffect(() => {
    if (!open || !attemptId) { setData(null); return; }
    setLoading(true);
    setCurrentQ(0);
    fetch(`/api/answers/${attemptId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [open, attemptId]);

  if (!open) return null;

  const totalQ = data?.questions.length ?? 0;
  const correct = data?.questions.filter((q) => q.studentAnswer?.isCorrect === true).length ?? 0;
  const wrong = data?.questions.filter((q) => q.studentAnswer?.isCorrect === false).length ?? 0;
  const empty = totalQ - (data?.questions.filter((q) => q.studentAnswer).length ?? 0);
  const q = data?.questions[currentQ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Review Jawaban</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
          </div>
        ) : !data ? (
          <div className="text-center py-8 text-sm text-gray-500">Gagal memuat data</div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Info header */}
            <div className="rounded-xl bg-gray-50 border p-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-semibold text-gray-900">{data.student.name}</p>
                  <p className="text-xs text-gray-500">{data.student.class} · {data.exam.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  {data.score !== null && (
                    <Badge className={`text-sm font-bold ${
                      data.exam.passingScore && data.score >= data.exam.passingScore
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-red-100 text-red-700 border-red-200"
                    } hover:opacity-100`}>
                      Nilai: {data.score}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mt-2 flex gap-4 text-xs">
                <span className="text-green-600 font-semibold">✓ {correct} Benar</span>
                <span className="text-red-500 font-semibold">✗ {wrong} Salah</span>
                <span className="text-gray-500">— {empty} Kosong</span>
                <span className="text-gray-400">Total: {totalQ} soal</span>
              </div>
            </div>

            {/* Number navigation */}
            <div className="flex flex-wrap gap-1.5">
              {data.questions.map((qItem, idx) => {
                const ans = qItem.studentAnswer;
                let color = "bg-gray-100 text-gray-500 border-gray-200"; // kosong
                if (ans?.isCorrect === true) color = "bg-green-500 text-white border-green-500";
                else if (ans?.isCorrect === false) color = "bg-red-500 text-white border-red-500";
                else if (ans && ans.score === null) color = "bg-yellow-400 text-white border-yellow-400"; // belum dikoreksi

                return (
                  <button key={idx} onClick={() => setCurrentQ(idx)}
                    className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold border transition-all ${
                      idx === currentQ ? "ring-2 ring-blue-400 ring-offset-1" : ""
                    } ${color}`}>
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Question Detail */}
            {q && (
              <div className="rounded-xl border bg-white p-4 space-y-3">
                {/* Status badge */}
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">Soal {q.number} dari {totalQ}</Badge>
                  {q.studentAnswer?.isCorrect === true && (
                    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 gap-1">
                      <CheckCircle className="h-3 w-3" />Benar
                    </Badge>
                  )}
                  {q.studentAnswer?.isCorrect === false && (
                    <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 gap-1">
                      <XCircle className="h-3 w-3" />Salah
                    </Badge>
                  )}
                  {!q.studentAnswer && (
                    <Badge className="bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100 gap-1">
                      <Minus className="h-3 w-3" />Tidak Dijawab
                    </Badge>
                  )}
                  {q.studentAnswer && q.studentAnswer.isCorrect === null && (
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100 gap-1">
                      <AlertCircle className="h-3 w-3" />Belum Dinilai
                    </Badge>
                  )}
                </div>

                {/* Question text */}
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                  <p className="text-sm text-blue-900 whitespace-pre-wrap">{q.questionText}</p>
                </div>

                {/* Options for PG/BS */}
                {q.options.length > 0 && (
                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const isSelected = q.studentAnswer?.selectedOptionId === opt.id;
                      const isCorrectOpt = opt.isCorrect;
                      let bgColor = "bg-white border-gray-200";
                      if (showCorrectAnswers && isCorrectOpt) bgColor = "bg-green-50 border-green-300";
                      if (isSelected && !isCorrectOpt) bgColor = "bg-red-50 border-red-300";
                      if (isSelected && isCorrectOpt) bgColor = "bg-green-50 border-green-300";

                      return (
                        <div key={opt.id} className={`flex items-center gap-2.5 rounded-lg border p-2.5 ${bgColor}`}>
                          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isSelected && isCorrectOpt ? "bg-green-500 text-white"
                            : isSelected && !isCorrectOpt ? "bg-red-500 text-white"
                            : showCorrectAnswers && isCorrectOpt ? "bg-green-100 text-green-700 border border-green-300"
                            : "bg-gray-100 text-gray-500"
                          }`}>
                            {isSelected && isCorrectOpt ? <CheckCircle className="h-3.5 w-3.5" />
                            : isSelected && !isCorrectOpt ? <XCircle className="h-3.5 w-3.5" />
                            : opt.label}
                          </div>
                          <span className="text-sm text-gray-700 flex-1">{opt.text}</span>
                          {isSelected && <span className="text-xs text-gray-400">(Jawaban Anda)</span>}
                          {showCorrectAnswers && isCorrectOpt && !isSelected && <span className="text-xs text-green-600">(Kunci)</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Essay/Isian answer */}
                {(q.questionType === "ESSAY" || q.questionType === "SHORT_ANSWER") && (
                  <div className="rounded-lg bg-gray-50 border p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Jawaban Siswa:</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {q.studentAnswer?.answerText || <span className="text-gray-400 italic">— Tidak ada jawaban —</span>}
                    </p>
                    {q.studentAnswer?.score !== null && q.studentAnswer?.score !== undefined && (
                      <p className="mt-2 text-sm font-bold text-purple-600">Skor: {q.studentAnswer.score}/100</p>
                    )}
                  </div>
                )}

                {/* Correct answer info */}
                {showCorrectAnswers && q.correctOptionLabel && q.studentAnswer?.isCorrect === false && (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                    <p className="text-xs font-semibold text-green-700">Jawaban Benar: {q.correctOptionLabel}. {q.correctOptionText}</p>
                  </div>
                )}

                {/* Explanation */}
                {showCorrectAnswers && q.explanation && (
                  <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3">
                    <p className="text-xs font-semibold text-indigo-700 mb-1">Pembahasan:</p>
                    <p className="text-sm text-indigo-900 whitespace-pre-wrap">{q.explanation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Prev / Next */}
            <div className="flex justify-between pt-1">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setCurrentQ((p) => Math.max(0, p - 1))} disabled={currentQ === 0}>
                <ChevronLeft className="h-4 w-4" />Sebelumnya
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setCurrentQ((p) => Math.min(totalQ - 1, p + 1))} disabled={currentQ >= totalQ - 1}>
                Selanjutnya<ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
