"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { submitSurvey } from "../../survey-actions";

type Survey = { id: string; title: string; questions: { id: string; text: string; category: string }[] };

const SCALE = [
  { value: 1, label: "Tidak Butuh" },
  { value: 2, label: "Cukup" },
  { value: 3, label: "Butuh" },
  { value: 4, label: "Sangat Butuh" },
];

export function SurveyFillClient({ survey }: { survey: Survey }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(fd: FormData) {
    setErr("");
    if (Object.keys(answers).length < survey.questions.length) {
      setErr("Harap jawab semua pertanyaan.");
      return;
    }
    fd.set("surveyId", survey.id);
    Object.entries(answers).forEach(([qid, v]) => fd.set(`q_${qid}`, String(v)));
    startTransition(async () => {
      const r = await submitSurvey(fd);
      if (r.error) setErr(r.error);
      else router.push("/student/bk");
    });
  }

  return (
    <form action={submit} className="space-y-4">
      {survey.questions.map((q, i) => (
        <div key={q.id} className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-800"><span className="text-gray-400">{i + 1}.</span> {q.text}</p>
          {q.category && <p className="mb-2 text-[11px] text-purple-600">{q.category}</p>}
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SCALE.map((s) => (
              <button key={s.value} type="button"
                onClick={() => setAnswers((a) => ({ ...a, [q.id]: s.value }))}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                  answers[q.id] === s.value ? "border-purple-600 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      {err && <p className="text-sm text-red-600">{err}</p>}
      <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={pending}>
        {pending ? "Mengirim..." : "Kirim Jawaban"}
      </Button>
    </form>
  );
}
