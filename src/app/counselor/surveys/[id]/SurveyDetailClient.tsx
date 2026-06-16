"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ClipboardList, BarChart3 } from "lucide-react";
import { saveQuestion, deleteQuestion } from "../../survey-actions";
import { useConfirm } from "@/components/ConfirmDialog";

type Survey = { id: string; title: string; questions: { id: string; text: string; category: string; orderNumber: number }[] };
type Results = {
  responseCount: number;
  perQuestion: { id: string; text: string; category: string; avg: number; count: number }[];
  priorities: { id: string; text: string; avg: number }[];
  responses: { id: string; studentName: string; className: string; submittedAt: string | Date }[];
} | null;

const fmt = (d: string | Date) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export function SurveyDetailClient({ survey, results }: { survey: Survey; results: Results }) {
  const [tab, setTab] = useState<"pertanyaan" | "hasil">("pertanyaan");
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function addQuestion(fd: FormData) {
    setErr("");
    fd.set("surveyId", survey.id);
    startTransition(async () => {
      const r = await saveQuestion(fd);
      if (r.error) setErr(r.error);
    });
  }
  async function removeQuestion(id: string) {
    if (!(await confirm("Hapus pertanyaan ini?"))) return;
    startTransition(async () => { await deleteQuestion(id, survey.id); });
  }

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        <button onClick={() => setTab("pertanyaan")} className={`rounded-lg px-4 py-1.5 text-sm font-medium ${tab === "pertanyaan" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}>
          Pertanyaan ({survey.questions.length})
        </button>
        <button onClick={() => setTab("hasil")} className={`rounded-lg px-4 py-1.5 text-sm font-medium ${tab === "hasil" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}>
          Hasil ({results?.responseCount ?? 0})
        </button>
      </div>

      {tab === "pertanyaan" && (
        <div className="max-w-2xl">
          <form action={addQuestion} className="mb-4 flex gap-2 rounded-xl border bg-white p-3 shadow-sm">
            <Input name="category" placeholder="Kategori (opsional)" className="w-40" />
            <Input name="text" placeholder="Tulis pernyataan / pertanyaan..." required />
            <Button type="submit" size="icon" className="bg-purple-600 hover:bg-purple-700 shrink-0" disabled={pending}><Plus className="h-4 w-4" /></Button>
          </form>
          {err && <p className="mb-2 text-sm text-red-600">{err}</p>}
          <p className="mb-2 text-xs text-gray-400">Siswa menjawab tiap pernyataan dengan skala: 1 (Tidak Butuh) – 4 (Sangat Butuh).</p>

          {survey.questions.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
              <ClipboardList className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">Belum ada pertanyaan.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {survey.questions.map((q, i) => (
                <div key={q.id} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3 shadow-sm">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-xs font-bold text-gray-400 mt-0.5">{i + 1}.</span>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800">{q.text}</p>
                      {q.category && <p className="text-[11px] text-purple-600">{q.category}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-red-500 hover:bg-red-50" onClick={() => removeQuestion(q.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "hasil" && (
        !results || results.responseCount === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
            <BarChart3 className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">Belum ada siswa yang mengisi angket ini.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold text-gray-900">5 Kebutuhan Prioritas Tertinggi</h2>
              <div className="space-y-2">
                {results.priorities.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">{i + 1}</span>
                      <p className="truncate text-sm text-gray-800">{p.text}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">{p.avg}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold text-gray-900">Rata-rata per Pertanyaan</h2>
              <div className="space-y-2">
                {results.perQuestion.map((q, i) => (
                  <div key={q.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5">{i + 1}.</span>
                    <p className="flex-1 truncate text-sm text-gray-700">{q.text}</p>
                    <div className="flex items-center gap-2 w-32">
                      <div className="h-2 flex-1 rounded-full bg-gray-100">
                        <div className="h-2 rounded-full bg-purple-500" style={{ width: `${(q.avg / 4) * 100}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 w-8">{q.avg}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold text-gray-900">Responden ({results.responseCount})</h2>
              <div className="space-y-1">
                {results.responses.map((r) => (
                  <div key={r.id} className="flex items-center justify-between border-b py-1.5 last:border-0 text-sm">
                    <span className="text-gray-800">{r.studentName} <span className="text-xs text-gray-400">· {r.className}</span></span>
                    <span className="text-xs text-gray-400">{fmt(r.submittedAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
