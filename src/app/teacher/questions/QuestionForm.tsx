"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { createQuestion, updateQuestion } from "./actions";

const questionTypes = [
  { value: "MULTIPLE_CHOICE",         label: "Pilihan Ganda" },
  { value: "MULTIPLE_CHOICE_COMPLEX", label: "Pilihan Ganda Kompleks" },
  { value: "TRUE_FALSE",              label: "Benar / Salah" },
  { value: "SHORT_ANSWER",            label: "Isian Singkat" },
  { value: "ESSAY",                   label: "Esai" },
];

type Subject = { id: string; name: string; code: string };
type Option = { label: string; text: string; correct: boolean };
type Existing = {
  id: string;
  subjectId: string;
  questionType: string;
  questionText: string;
  difficulty: string;
  scoreWeight: number;
  explanation: string | null;
  material: string | null;
  grade: string | null;
  options: { optionLabel: string; optionText: string; isCorrect: boolean }[];
};

type Props = {
  subjects: Subject[];
  existing?: Existing | null;
  defaultSubjectId?: string | null;
};

export function QuestionForm({ subjects, existing, defaultSubjectId }: Props) {
  const router = useRouter();
  const [type, setType] = useState(existing?.questionType ?? "MULTIPLE_CHOICE");
  const [subjectId, setSubjectId] = useState(existing?.subjectId ?? defaultSubjectId ?? subjects[0]?.id ?? "");
  const [grade, setGrade] = useState(existing?.grade ?? "XII");
  const [difficulty, setDifficulty] = useState(existing?.difficulty ?? "MEDIUM");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const initialOptions = (): Option[] => {
    if (existing && existing.options.length > 0) {
      return existing.options.map((o) => ({
        label: o.optionLabel, text: o.optionText, correct: o.isCorrect,
      }));
    }
    if (type === "TRUE_FALSE") {
      return [
        { label: "A", text: "Benar", correct: false },
        { label: "B", text: "Salah", correct: false },
      ];
    }
    return ["A", "B", "C", "D"].map((l) => ({ label: l, text: "", correct: false }));
  };
  const [options, setOptions] = useState<Option[]>(initialOptions);

  function changeType(newType: string) {
    setType(newType);
    if (newType === "TRUE_FALSE") {
      setOptions([
        { label: "A", text: "Benar", correct: false },
        { label: "B", text: "Salah", correct: false },
      ]);
    } else if (["MULTIPLE_CHOICE", "MULTIPLE_CHOICE_COMPLEX"].includes(newType) && options.length < 2) {
      setOptions(["A", "B", "C", "D"].map((l) => ({ label: l, text: "", correct: false })));
    }
  }

  function toggleCorrect(idx: number) {
    if (type === "MULTIPLE_CHOICE_COMPLEX") {
      setOptions((prev) => prev.map((o, i) => i === idx ? { ...o, correct: !o.correct } : o));
    } else {
      setOptions((prev) => prev.map((o, i) => ({ ...o, correct: i === idx })));
    }
  }

  function updateOptionText(idx: number, val: string) {
    setOptions((prev) => prev.map((o, i) => i === idx ? { ...o, text: val } : o));
  }

  function addOption() {
    const labels = "ABCDEFGHIJ";
    setOptions((p) => [...p, { label: labels[p.length] ?? "?", text: "", correct: false }]);
  }

  function removeOption(idx: number) {
    setOptions((p) => p.filter((_, i) => i !== idx));
  }

  const showOptions = ["MULTIPLE_CHOICE", "MULTIPLE_CHOICE_COMPLEX", "TRUE_FALSE"].includes(type);

  async function handleSubmit(formData: FormData) {
    setError("");
    formData.set("subjectId", subjectId);
    formData.set("questionType", type);
    formData.set("difficulty", difficulty);
    formData.set("grade", grade);
    formData.set("options", JSON.stringify(options));

    startTransition(async () => {
      const r = existing
        ? await updateQuestion(existing.id, formData)
        : await createQuestion(formData);
      if (r.error) setError(r.error);
      else router.push("/teacher/questions");
    });
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/teacher/questions">
          <Button variant="ghost" size="icon" className="h-9 w-9 border">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">
            {existing ? "Edit Soal" : "Tambah Soal Baru"}
          </h1>
          <p className="text-sm text-gray-500">Isi detail soal, pilihan jawaban, dan kunci jawaban</p>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-5">
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
          <p className="font-semibold text-gray-700">Informasi Soal</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Mata Pelajaran *</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.code} – {s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Kelas</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="X">X</SelectItem>
                  <SelectItem value="XI">XI</SelectItem>
                  <SelectItem value="XII">XII</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tingkat Kesulitan</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Mudah</SelectItem>
                  <SelectItem value="MEDIUM">Sedang</SelectItem>
                  <SelectItem value="HARD">Sulit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Jenis Soal</Label>
              <Select value={type} onValueChange={changeType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {questionTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scoreWeight">Bobot Nilai</Label>
              <Input id="scoreWeight" name="scoreWeight" type="number" defaultValue={existing?.scoreWeight ?? 1} min="0.1" step="0.1" />
            </div>
            <div className="col-span-full space-y-1.5">
              <Label htmlFor="material">Materi / Kompetensi</Label>
              <Input id="material" name="material" defaultValue={existing?.material ?? ""} placeholder="cth: Limit fungsi aljabar" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
          <p className="font-semibold text-gray-700">Teks Soal *</p>
          <Textarea name="questionText" defaultValue={existing?.questionText ?? ""} placeholder="Tulis pertanyaan di sini..." className="min-h-28 resize-y" required />
        </div>

        {showOptions && (
          <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-700">Pilihan Jawaban</p>
              {type === "MULTIPLE_CHOICE_COMPLEX" && (
                <span className="text-xs text-gray-500">Boleh lebih dari 1 jawaban benar</span>
              )}
            </div>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className={`flex items-center gap-2 rounded-lg border p-2.5 transition-colors ${opt.correct ? "border-emerald-400 bg-emerald-50" : ""}`}>
                  <button type="button" onClick={() => toggleCorrect(idx)}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                      opt.correct ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-300 text-gray-500 hover:border-emerald-400"
                    }`}>
                    {opt.correct ? <CheckCircle className="h-4 w-4" /> : opt.label}
                  </button>
                  <Input value={opt.text} onChange={(e) => updateOptionText(idx, e.target.value)} placeholder={`Pilihan ${opt.label}`} className="flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-sm" />
                  {type !== "TRUE_FALSE" && options.length > 2 && (
                    <button type="button" onClick={() => removeOption(idx)} className="text-gray-300 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {type !== "TRUE_FALSE" && options.length < 6 && (
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addOption}>
                <Plus className="h-4 w-4" />Tambah Opsi
              </Button>
            )}
          </div>
        )}

        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
          <p className="font-semibold text-gray-700">Pembahasan (opsional)</p>
          <Textarea name="explanation" defaultValue={existing?.explanation ?? ""} placeholder="Penjelasan jawaban benar..." className="min-h-20 resize-y" />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />{error}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Link href="/teacher/questions">
            <Button type="button" variant="outline">Batal</Button>
          </Link>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={pending}>
            {pending ? "Menyimpan..." : existing ? "Simpan Perubahan" : "Simpan Soal"}
          </Button>
        </div>
      </form>
    </div>
  );
}
