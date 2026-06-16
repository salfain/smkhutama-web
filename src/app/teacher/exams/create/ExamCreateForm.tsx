"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, AlertCircle, Search, FileText } from "lucide-react";
import { createExamWithQuestions } from "../actions";
import { EXAM_TYPES } from "@/lib/exam-types";

type Question = {
  id: string;
  questionText: string;
  questionType: string;
  difficulty: string;
  subjectId: string;
  subject: { code: string };
};

type Props = {
  subjects: { id: string; name: string; code: string }[];
  classes: { id: string; name: string }[];
  academicYears: { id: string; year: string; semester: string; isActive: boolean }[];
  myQuestions: Question[];
  defaultSubjectId: string | null;
};

const typeLabel: Record<string, string> = {
  MULTIPLE_CHOICE: "PG",
  MULTIPLE_CHOICE_COMPLEX: "PGK",
  TRUE_FALSE: "BS",
  SHORT_ANSWER: "Isian",
  ESSAY: "Esai",
};
const diffColor: Record<string, string> = {
  EASY: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HARD: "bg-red-100 text-red-700",
};

export function ExamCreateForm({ subjects, classes, academicYears, myQuestions, defaultSubjectId }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const [subjectId, setSubjectId] = useState(defaultSubjectId ?? subjects[0]?.id ?? "");
  const [academicYearId, setAcademicYearId] = useState(academicYears.find((y) => y.isActive)?.id ?? "none");
  const [statusVal, setStatusVal] = useState<"DRAFT" | "ACTIVE">("DRAFT");
  const [examType, setExamType] = useState<"UH" | "UTS" | "UAS" | "US" | "TRYOUT" | "LAINNYA">("UH");
  const [classIds, setClassIds] = useState<string[]>([]);
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  // Filter pertanyaan by subject
  const filteredQuestions = myQuestions.filter((q) => {
    const matchSubject = !subjectId || q.subjectId === subjectId;
    const matchSearch = q.questionText.toLowerCase().includes(search.toLowerCase());
    return matchSubject && matchSearch;
  });

  function toggleClass(id: string) {
    setClassIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }
  function toggleQuestion(id: string) {
    setQuestionIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }
  function selectAllVisible() {
    const ids = filteredQuestions.map((q) => q.id);
    setQuestionIds([...new Set([...questionIds, ...ids])]);
  }
  function clearSelection() {
    setQuestionIds([]);
  }

  async function handleSubmit(formData: FormData) {
    setError("");
    formData.set("subjectId", subjectId);
    formData.set("academicYearId", academicYearId === "none" ? "" : academicYearId);
    formData.set("status", statusVal);
    formData.set("examType", examType);
    formData.delete("classIds");
    classIds.forEach((id) => formData.append("classIds", id));
    formData.delete("questionIds");
    questionIds.forEach((id) => formData.append("questionIds", id));

    startTransition(async () => {
      const r = await createExamWithQuestions(formData);
      if (r.error) setError(r.error);
      else router.push("/teacher/exams");
    });
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/teacher/exams">
          <Button variant="ghost" size="icon" className="h-9 w-9 border"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Buat Paket Ujian</h1>
          <p className="text-sm text-gray-500">Atur jadwal & pilih soal dari bank soal Anda</p>
        </div>
      </div>

      <form action={handleSubmit} className="grid gap-5 lg:grid-cols-3">
        {/* Form fields */}
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Judul Ujian *</Label>
              <Input id="title" name="title" placeholder="cth: UTS Matematika XII" required />
            </div>
            <div className="space-y-1.5">
              <Label>Jenis Ujian *</Label>
              <Select value={examType} onValueChange={(v) => setExamType(v as typeof examType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXAM_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.short} – {t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Mata Pelajaran *</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.code} – {s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="durationMinutes">Durasi (menit)</Label>
                <Input id="durationMinutes" name="durationMinutes" type="number" min="1" defaultValue={90} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="passingScore">KKM</Label>
                <Input id="passingScore" name="passingScore" type="number" min="0" max="100" placeholder="75" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startAt">Waktu Mulai *</Label>
              <Input id="startAt" name="startAt" type="datetime-local" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endAt">Waktu Selesai *</Label>
              <Input id="endAt" name="endAt" type="datetime-local" required />
            </div>
            <div className="space-y-1.5">
              <Label>Tahun Ajaran</Label>
              <Select value={academicYearId} onValueChange={setAcademicYearId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tidak diset —</SelectItem>
                  {academicYears.map((y) => (
                    <SelectItem key={y.id} value={y.id}>{y.year} {y.semester === "GANJIL" ? "Ganjil" : "Genap"}{y.isActive ? " (Aktif)" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={statusVal} onValueChange={(v) => setStatusVal(v as "DRAFT" | "ACTIVE")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft (belum dipublikasikan)</SelectItem>
                  <SelectItem value="ACTIVE">Aktif (siap dikerjakan)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
            <p className="text-sm font-semibold text-gray-700">Kelas Peserta</p>
            <div className="rounded-lg border bg-gray-50 p-3 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {classes.length === 0 ? (
                <p className="col-span-2 text-xs text-gray-400">Belum ada kelas terdaftar</p>
              ) : classes.map((c) => (
                <label key={c.id} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={classIds.includes(c.id)} onChange={() => toggleClass(c.id)} className="h-4 w-4 rounded border-gray-300 text-emerald-600" />
                  {c.name}
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400">{classIds.length} kelas dipilih</p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm space-y-2">
            <p className="text-sm font-semibold text-gray-700">Opsi Ujian</p>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="randomizeQuestions" className="h-4 w-4 rounded border-gray-300 text-emerald-600" />
              Acak urutan soal
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="randomizeOptions" className="h-4 w-4 rounded border-gray-300 text-emerald-600" />
              Acak pilihan jawaban
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="showResult" className="h-4 w-4 rounded border-gray-300 text-emerald-600" />
              Tampilkan nilai langsung setelah submit
            </label>
          </div>
        </div>

        {/* Question selection */}
        <div className="space-y-3 lg:col-span-2">
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="border-b p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700">Pilih Soal dari Bank Soal *</p>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{questionIds.length} dipilih</Badge>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input placeholder="Cari soal..." className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={selectAllVisible} disabled={filteredQuestions.length === 0}>Pilih Semua</Button>
                <Button type="button" variant="outline" size="sm" onClick={clearSelection} disabled={questionIds.length === 0}>Kosongkan</Button>
              </div>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {filteredQuestions.length === 0 ? (
                <div className="p-10 text-center">
                  <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-500">{myQuestions.length === 0 ? "Belum ada soal. Buat soal di Bank Soal." : "Tidak ada soal cocok dengan filter."}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredQuestions.map((q, idx) => {
                    const selected = questionIds.includes(q.id);
                    return (
                      <label key={q.id} className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 ${selected ? "bg-emerald-50/50" : ""}`}>
                        <input type="checkbox" checked={selected} onChange={() => toggleQuestion(q.id)} className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600" />
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gray-100 text-xs font-bold text-gray-500">{idx + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-800 line-clamp-2">{q.questionText}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <Badge variant="secondary" className="text-xs">{typeLabel[q.questionType] ?? q.questionType}</Badge>
                            <span className={`text-xs px-2 py-0.5 rounded ${diffColor[q.difficulty] ?? ""}`}>
                              {q.difficulty === "EASY" ? "Mudah" : q.difficulty === "MEDIUM" ? "Sedang" : "Sulit"}
                            </span>
                            <span className="text-xs text-gray-400">{q.subject.code}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />{error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Link href="/teacher/exams"><Button type="button" variant="outline">Batal</Button></Link>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={pending}>
              {pending ? "Menyimpan..." : "Buat Paket Ujian"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
