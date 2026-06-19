"use client";

import { useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";
import { importQuestionSet } from "./actions";

type Subject = { id: string; name: string; code: string };
type QuestionSetRow = {
  id: string;
  title: string;
  examType: string;
  grade: string | null;
  source: string;
  status: string;
  sourceFileName: string | null;
  totalQuestions: number;
  multipleChoiceCount: number;
  essayCount: number;
  invalidCount: number;
  createdAt: string;
  subject: { code: string; name: string };
  _count: { questions: number };
};

const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Diajukan",
  APPROVED: "Disetujui",
  USED: "Dipakai",
};

const sourceLabel: Record<string, string> = {
  TEACHER_IMPORT: "Import Guru",
  ADMIN_IMPORT: "Import Admin",
};

export function QuestionSetsClient({
  questionSets,
  subjects,
  defaultSubjectId,
}: {
  questionSets: QuestionSetRow[];
  subjects: Subject[];
  defaultSubjectId: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ message?: string; errors?: string[]; error?: string } | null>(null);

  async function handleImport(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const response = await importQuestionSet(formData);
      setResult(response);
      if ("success" in response && response.success) {
        formRef.current?.reset();
      }
    });
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Paket Bank Soal</h1>
        <p className="text-sm text-gray-500">Import soal sebagai satu paket, lalu admin dapat memakai paket ini untuk UTS/UAS/US.</p>
      </div>

      <Card className="mb-6 border shadow-sm">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-emerald-50 p-2">
              <Upload className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Import Paket Soal</p>
              <p className="text-xs text-gray-500">Mendukung template Excel lama: JENIS SOAL, KATEGORI, ACAK, SOAL, JAWAB1-5, KUNCI JAWABAN.</p>
            </div>
          </div>

          <form ref={formRef} action={handleImport} className="grid gap-4 lg:grid-cols-5">
            <div className="space-y-1.5 lg:col-span-2">
              <Label htmlFor="title">Nama Paket *</Label>
              <Input id="title" name="title" placeholder="cth: UAS DPK X TKJ" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subjectId">Mapel *</Label>
              <select
                id="subjectId"
                name="subjectId"
                defaultValue={defaultSubjectId ?? subjects[0]?.id ?? ""}
                className="h-8 w-full rounded-lg border border-input bg-white px-2.5 text-sm"
                required
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.code} - {subject.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="examType">Jenis</Label>
              <select id="examType" name="examType" defaultValue="UTS" className="h-8 w-full rounded-lg border border-input bg-white px-2.5 text-sm">
                <option value="UTS">UTS</option>
                <option value="UAS">UAS</option>
                <option value="US">US</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grade">Tingkat/Kelas</Label>
              <Input id="grade" name="grade" placeholder="X / XI / XII" />
            </div>
            <div className="space-y-1.5 lg:col-span-4">
              <Label htmlFor="file">File Excel *</Label>
              <Input id="file" name="file" type="file" accept=".xls,.xlsx" required />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={pending}>
                {pending ? "Mengimport..." : "Import Paket"}
              </Button>
            </div>
          </form>

          {result?.error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <div className="flex items-center gap-2 font-semibold"><AlertCircle className="h-4 w-4" />{result.error}</div>
              {result.errors && <ErrorList errors={result.errors} />}
            </div>
          )}
          {result?.message && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4" />{result.message}</div>
              {result.errors && <ErrorList errors={result.errors} tone="warning" />}
            </div>
          )}
        </CardContent>
      </Card>

      {questionSets.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <FileSpreadsheet className="mx-auto mb-2 h-9 w-9 text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">Belum ada paket soal</p>
          <p className="mt-1 text-xs text-gray-500">Import file Excel pertama untuk membuat paket bank soal.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {questionSets.map((set) => (
            <Card key={set.id} className="border shadow-sm">
              <CardContent className="p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{set.title}</p>
                    <p className="text-xs text-gray-500">
                      {set.subject.code} - {set.examType}{set.grade ? ` - ${set.grade}` : ""} - {new Date(set.createdAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    {statusLabel[set.status] ?? set.status}
                  </Badge>
                </div>

                <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Total" value={set.totalQuestions} />
                  <Stat label="PG" value={set.multipleChoiceCount} />
                  <Stat label="Esai" value={set.essayCount} />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <Badge variant="secondary">{sourceLabel[set.source] ?? set.source}</Badge>
                  {set.sourceFileName && <span className="truncate">File: {set.sourceFileName}</span>}
                  {set.invalidCount > 0 && (
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                      {set.invalidCount} baris dilewati
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function ErrorList({ errors, tone = "error" }: { errors: string[]; tone?: "error" | "warning" }) {
  return (
    <div className={`mt-2 max-h-32 overflow-y-auto rounded border px-3 py-2 text-xs ${
      tone === "warning" ? "border-yellow-200 bg-yellow-50 text-yellow-800" : "border-red-200 bg-white/70 text-red-700"
    }`}>
      {errors.slice(0, 20).map((error, idx) => (
        <p key={idx}>{error}</p>
      ))}
      {errors.length > 20 && <p>...dan {errors.length - 20} error lainnya</p>}
    </div>
  );
}
