"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Save } from "lucide-react";
import { gradeEssay } from "./actions";

type Essay = {
  id: string;
  answerText: string;
  score: number | null;
  question: { questionText: string; subject: { code: string } };
  attempt: {
    student: { user: { name: string }; class: { name: string } | null };
    exam: { title: string };
  };
};

export function EssayGradingList({ essays }: { essays: Essay[] }) {
  const [scores, setScores] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function handleGrade(id: string) {
    const score = scores[id];
    if (!score) { alert("Masukkan nilai dulu"); return; }
    const fd = new FormData();
    fd.set("score", score);
    startTransition(async () => {
      const r = await gradeEssay(id, fd);
      if (r.error) alert(r.error);
    });
  }

  return (
    <div className="space-y-4">
      {essays.map((e, i) => {
        const isGraded = e.score !== null;
        return (
          <div key={e.id} className={`rounded-xl border p-5 shadow-sm ${isGraded ? "bg-green-50/30 border-green-200" : "bg-white"}`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{e.attempt.student.user.name}</p>
                <p className="text-xs text-gray-400">
                  {e.attempt.student.class?.name ?? "—"} · {e.attempt.exam.title}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isGraded && (
                  <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 gap-1">
                    <CheckCircle className="h-3 w-3" />Nilai: {e.score}
                  </Badge>
                )}
                <Badge variant="secondary">Esai #{i + 1}</Badge>
              </div>
            </div>

            <div className="mb-3 rounded-lg bg-blue-50 border border-blue-100 p-3">
              <p className="text-xs font-semibold text-blue-700 mb-1">Soal:</p>
              <p className="text-sm text-blue-900 whitespace-pre-wrap">{e.question.questionText}</p>
            </div>

            <div className="mb-4 rounded-lg bg-gray-50 border p-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">Jawaban Siswa:</p>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {e.answerText || <span className="text-gray-400 italic">— Tidak ada jawaban —</span>}
              </p>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor={`score-${e.id}`}>Nilai (0–100)</Label>
                <Input
                  id={`score-${e.id}`} type="number" min="0" max="100"
                  defaultValue={e.score ?? ""}
                  onChange={(ev) => setScores((p) => ({ ...p, [e.id]: ev.target.value }))}
                  className="h-10 max-w-32"
                />
              </div>
              <Button onClick={() => handleGrade(e.id)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" disabled={pending}>
                <Save className="h-3.5 w-3.5" />Simpan Nilai
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
