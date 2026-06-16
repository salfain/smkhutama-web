"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Calendar, Clock, FileText, Users, PlayCircle, StopCircle, Trash2,
  KeyRound, Copy, Check, Eye, EyeOff,
} from "lucide-react";
import { changeMyExamStatus, deleteMyExam, createTokenByTeacher } from "./actions";
import { getExamTypeInfo } from "@/lib/exam-types";
import { canTeacherCreateToken } from "@/lib/exam-permissions";

type Exam = {
  id: string;
  title: string;
  status: "DRAFT" | "ACTIVE" | "CLOSED";
  examType: "UH" | "UTS" | "UAS" | "US" | "TRYOUT" | "LAINNYA";
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  subject: { code: string };
  classes: { name: string }[];
  _count: { questions: number; attempts: number };
};

const statusStyle: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  DRAFT:  "bg-yellow-100 text-yellow-700 border-yellow-200",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
};
const statusLabel: Record<string, string> = { ACTIVE: "Aktif", DRAFT: "Draft", CLOSED: "Selesai" };

function fmt(d: Date) {
  return new Date(d).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function ExamsList({ exams }: { exams: Exam[] }) {
  const [pending, startTransition] = useTransition();
  const [tokenDialog, setTokenDialog] = useState<{ examId: string; title: string } | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenDuration, setTokenDuration] = useState("60");
  const [copied, setCopied] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [tokenError, setTokenError] = useState("");

  function handleStatus(e: Exam, status: "DRAFT" | "ACTIVE" | "CLOSED") {
    startTransition(async () => { await changeMyExamStatus(e.id, status); });
  }

  function handleDelete(e: Exam) {
    if (!confirm(`Hapus ujian "${e.title}"?`)) return;
    startTransition(async () => {
      const r = await deleteMyExam(e.id);
      if (r.error) {
        if ("hasAttempts" in r && r.hasAttempts) {
          const forceConfirm = confirm(
            `${r.error}\n\n⚠️ PERHATIAN: Hapus paksa akan menghapus SEMUA jawaban & nilai siswa terkait ujian ini. Data tidak bisa dikembalikan.\n\nYakin ingin hapus paksa?`
          );
          if (forceConfirm) {
            const r2 = await deleteMyExam(e.id, true);
            if (r2.error) alert(r2.error);
          }
        } else {
          alert(r.error);
        }
      }
    });
  }

  function openTokenDialog(e: Exam) {
    setTokenDialog({ examId: e.id, title: e.title });
    setGeneratedToken(null);
    setTokenError("");
    setShowToken(false);
    setCopied(false);
  }

  function handleGenerateToken() {
    if (!tokenDialog) return;
    setTokenError("");
    startTransition(async () => {
      const r = await createTokenByTeacher(tokenDialog.examId, Number(tokenDuration));
      if (r.error) setTokenError(r.error);
      else if (r.token) { setGeneratedToken(r.token); setShowToken(true); }
    });
  }

  function copyToken() {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
    <div className="space-y-3">
      {exams.map((e) => {
        const typeInfo = getExamTypeInfo(e.examType);
        return (
        <div key={e.id} className="rounded-xl border bg-white p-4 shadow-sm hover:border-emerald-200 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900">{e.title}</p>
                <Badge className={`text-xs hover:opacity-100 ${typeInfo.color}`}>{typeInfo.short}</Badge>
                <Badge variant="secondary" className="font-mono text-xs">{e.subject.code}</Badge>
                <Badge className={`text-xs hover:opacity-100 ${statusStyle[e.status]}`}>
                  {e.status === "ACTIVE" && "● "}{statusLabel[e.status]}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{fmt(e.startAt)}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{e.durationMinutes} menit</span>
                <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{e._count.questions} soal</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{e._count.attempts} peserta</span>
                {e.classes.length > 0 && <span>Kelas: {e.classes.map((c) => c.name).join(", ")}</span>}
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              {e.status === "DRAFT" && (
                <Button variant="outline" size="sm" className="gap-1 text-xs text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleStatus(e, "ACTIVE")} disabled={pending}>
                  <PlayCircle className="h-3.5 w-3.5" />Aktifkan
                </Button>
              )}
              {e.status === "ACTIVE" && (
                <Button variant="outline" size="sm" className="gap-1 text-xs text-gray-600" onClick={() => handleStatus(e, "CLOSED")} disabled={pending}>
                  <StopCircle className="h-3.5 w-3.5" />Tutup
                </Button>
              )}
              {e.status === "ACTIVE" && canTeacherCreateToken(e.examType) && (
                <Button variant="outline" size="sm" className="gap-1 text-xs text-purple-600 border-purple-200 hover:bg-purple-50" onClick={() => openTokenDialog(e)} disabled={pending}>
                  <KeyRound className="h-3.5 w-3.5" />Token
                </Button>
              )}
              {e.status === "ACTIVE" && !canTeacherCreateToken(e.examType) && (
                <Badge className="bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100 text-xs shrink-0">
                  Token oleh Admin
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(e)} disabled={pending}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
        );
      })}
    </div>

    {/* Token Dialog */}
    <Dialog open={!!tokenDialog} onOpenChange={(v) => { if (!v) setTokenDialog(null); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-purple-600" />
            Generate Token Ujian
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
            <p className="text-sm font-medium text-blue-800">{tokenDialog?.title}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Durasi Token</label>
            <Select value={tokenDuration} onValueChange={setTokenDuration}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 menit</SelectItem>
                <SelectItem value="60">1 jam</SelectItem>
                <SelectItem value="120">2 jam</SelectItem>
                <SelectItem value="240">4 jam</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full gap-2 bg-purple-600 hover:bg-purple-700" onClick={handleGenerateToken} disabled={pending}>
            <KeyRound className="h-4 w-4" />{pending ? "Generating..." : "Generate Token"}
          </Button>

          {tokenError && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{tokenError}</p>
          )}

          {generatedToken && (
            <div className="rounded-xl border-2 border-green-300 bg-green-50 p-4 text-center space-y-2">
              <p className="text-xs text-green-700 font-semibold">✓ Token berhasil dibuat</p>
              <div className="flex items-center gap-2 justify-center">
                <div className="font-mono text-2xl font-bold tracking-[0.2em] text-green-800">
                  {showToken ? generatedToken : generatedToken.replace(/[A-Z0-9]/g, "•")}
                </div>
                <button onClick={() => setShowToken(!showToken)} className="text-green-600 hover:text-green-800">
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button onClick={copyToken} className="text-green-600 hover:text-green-800">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-green-600">
                Berlaku {tokenDuration} menit. Berikan token ini kepada siswa.
              </p>
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={() => setTokenDialog(null)}>Tutup</Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
