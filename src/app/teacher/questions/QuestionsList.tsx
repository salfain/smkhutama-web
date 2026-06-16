"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Search, Pencil, Trash2, Filter, FileText, Power, PowerOff,
  Upload, FileDown, AlertCircle, CheckCircle,
} from "lucide-react";
import { deleteQuestion, toggleQuestionActive, importQuestionsExcel, getQuestionImportTemplate } from "./actions";
import { useConfirm } from "@/components/ConfirmDialog";

type Question = {
  id: string;
  questionText: string;
  questionType: string;
  difficulty: string;
  grade: string | null;
  isActive: boolean;
  subject: { code: string };
  _count: { options: number; examQuestions: number };
};

const typeLabel: Record<string, string> = {
  MULTIPLE_CHOICE: "Pilihan Ganda",
  MULTIPLE_CHOICE_COMPLEX: "PG Kompleks",
  TRUE_FALSE: "Benar/Salah",
  MATCHING: "Menjodohkan",
  SHORT_ANSWER: "Isian Singkat",
  ESSAY: "Esai",
};
const diffColor: Record<string, string> = {
  EASY: "bg-green-100 text-green-700 border-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
  HARD: "bg-red-100 text-red-700 border-red-200",
};
const diffLabel: Record<string, string> = { EASY: "Mudah", MEDIUM: "Sedang", HARD: "Sulit" };

export function QuestionsList({ questions }: { questions: Question[] }) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDiff, setFilterDiff] = useState("all");
  const [importOpen, setImportOpen] = useState(false);
  const [importMsg, setImportMsg] = useState<{ msg: string; errors?: string[] } | null>(null);
  const [pending, startTransition] = useTransition();
  const importFileRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();

  async function handleDelete(q: Question) {
    if (!(await confirm("Hapus soal ini?"))) return;
    startTransition(async () => {
      const r = await deleteQuestion(q.id);
      if (r.error) alert(r.error);
    });
  }

  function handleToggle(q: Question) {
    startTransition(async () => { await toggleQuestionActive(q.id); });
  }

  function downloadBlob(data: number[], filename: string) {
    const blob = new Blob([new Uint8Array(data)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadTemplate() {
    startTransition(async () => {
      const r = await getQuestionImportTemplate();
      downloadBlob(r.data, r.filename);
    });
  }

  async function handleImport(formData: FormData) {
    setImportMsg(null);
    startTransition(async () => {
      const r = await importQuestionsExcel(formData);
      if (r.error) {
        setImportMsg({ msg: r.error });
      } else {
        setImportMsg({ msg: r.message ?? "Import selesai", errors: r.errors });
        if (importFileRef.current) importFileRef.current.value = "";
      }
    });
  }

  const filtered = questions.filter((q) => {
    const matchText = q.questionText.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || q.questionType === filterType;
    const matchDiff = filterDiff === "all" || q.difficulty === filterDiff;
    return matchText && matchType && matchDiff;
  });

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Cari soal..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="mr-2 h-4 w-4 text-gray-400" /><SelectValue placeholder="Jenis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis</SelectItem>
            {Object.entries(typeLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterDiff} onValueChange={setFilterDiff}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Kesulitan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tingkat</SelectItem>
            <SelectItem value="EASY">Mudah</SelectItem>
            <SelectItem value="MEDIUM">Sedang</SelectItem>
            <SelectItem value="HARD">Sulit</SelectItem>
          </SelectContent>
        </Select>
        <Link href="/teacher/questions/create">
          <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" />Tambah Soal
          </Button>
        </Link>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setImportMsg(null); setImportOpen(true); }}>
          <Upload className="h-4 w-4" />Import Excel
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">{questions.length === 0 ? "Belum ada soal. Tambah soal pertama Anda." : "Tidak ada hasil pencarian."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q, i) => (
            <div key={q.id} className={`rounded-xl border bg-white p-4 shadow-sm hover:border-emerald-200 transition-colors ${!q.isActive ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500 mt-0.5">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800 leading-relaxed line-clamp-2">{q.questionText}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{typeLabel[q.questionType] ?? q.questionType}</Badge>
                    <Badge className={`text-xs hover:opacity-100 ${diffColor[q.difficulty]}`}>{diffLabel[q.difficulty] ?? q.difficulty}</Badge>
                    <Badge variant="secondary" className="text-xs">{q.subject.code}</Badge>
                    {q.grade && <span className="text-xs text-gray-400">Kelas {q.grade}</span>}
                    <span className="text-xs text-gray-400">· {q._count.options} opsi</span>
                    {q._count.examQuestions > 0 && <span className="text-xs text-blue-500">· dipakai {q._count.examQuestions} ujian</span>}
                    {!q.isActive && <Badge className="bg-gray-200 text-gray-600 text-xs hover:bg-gray-200">Nonaktif</Badge>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" className={`h-8 w-8 ${q.isActive ? "text-yellow-600 hover:bg-yellow-50" : "text-green-600 hover:bg-green-50"}`} onClick={() => handleToggle(q)} disabled={pending} title={q.isActive ? "Nonaktifkan" : "Aktifkan"}>
                    {q.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                  </Button>
                  <Link href={`/teacher/questions/${q.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(q)} disabled={pending}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={(v) => { setImportOpen(v); setImportMsg(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Soal dari Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
            {/* Info kolom */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-700 space-y-1.5">
              <p className="font-semibold">Format kolom Excel:</p>
              <ul className="space-y-0.5 pl-1">
                <li>• <span className="font-medium">Jenis Soal</span> — PG / PGK / BS / ISIAN / ESAI</li>
                <li>• <span className="font-medium">Kode Mapel</span> — wajib ada di database (cth: MTK, BIG)</li>
                <li>• <span className="font-medium">Kelas</span> — X / XI / XII</li>
                <li>• <span className="font-medium">Tingkat Kesulitan</span> — MUDAH / SEDANG / SULIT</li>
                <li>• <span className="font-medium">Materi</span> — opsional</li>
                <li>• <span className="font-medium">Bobot</span> — angka, default 1</li>
                <li>• <span className="font-medium">Teks Soal</span> — wajib</li>
                <li>• <span className="font-medium">Pilihan A–E</span> — diisi untuk PG/PGK</li>
                <li>• <span className="font-medium">Kunci Jawaban</span> — A atau A,C (untuk PGK)</li>
                <li>• <span className="font-medium">Pembahasan</span> — opsional</li>
              </ul>
              <p className="pt-1 text-emerald-800">
                <strong>Esai/Isian:</strong> kosongkan kolom Pilihan dan Kunci.
              </p>
            </div>

            {/* Download template */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 border p-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Download Template</p>
                <p className="text-xs text-gray-400">Excel dengan 5 contoh soal lengkap</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 ml-3 shrink-0" onClick={handleDownloadTemplate} disabled={pending}>
                <FileDown className="h-4 w-4" />Template
              </Button>
            </div>

            {/* Upload form */}
            <form action={handleImport} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="question-file">Pilih File Excel *</Label>
                <Input ref={importFileRef} id="question-file" name="file" type="file" accept=".xlsx,.xls" required />
                <p className="text-xs text-gray-400">Format .xlsx atau .xls</p>
              </div>

              {importMsg && (
                <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                  importMsg.errors
                    ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                    : "bg-green-50 border-green-200 text-green-700"
                }`}>
                  {importMsg.errors
                    ? <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    : <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                  <div className="min-w-0">
                    <p className="font-medium">{importMsg.msg}</p>
                    {importMsg.errors && (
                      <div className="mt-1 max-h-32 overflow-y-auto">
                        {importMsg.errors.map((e, i) => (
                          <p key={i} className="text-xs mt-0.5 opacity-80">{e}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>Tutup</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={pending}>
                  {pending ? "Mengimport..." : "Import Sekarang"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
