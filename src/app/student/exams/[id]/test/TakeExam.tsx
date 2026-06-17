"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Flag, ChevronLeft, ChevronRight, Send, Grid3X3,
  Clock, CheckCircle, AlertCircle, ShieldAlert,
} from "lucide-react";
import { saveAnswer, submitExam } from "../actions";
import { MathText } from "@/components/MathText";

const MAX_VIOLATIONS = 5; // setelah ini, ujian otomatis di-submit

type Option = { id: string; label: string; text: string };
type Question = {
  id: string;
  questionText: string;
  questionType: "MULTIPLE_CHOICE" | "MULTIPLE_CHOICE_COMPLEX" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "MATCHING";
  options: Option[];
};

type AnswerState = {
  selectedOptionId?: string | null;
  answerText?: string | null;
  isDoubtful: boolean;
};

type Props = {
  examId: string;
  title: string;
  subjectCode: string;
  questions: Question[];
  initialAnswers: Record<string, AnswerState>;
  expiresAt: string;
  randomizeOptions: boolean;
};

export function TakeExam({
  examId, title, subjectCode, questions: rawQuestions, initialAnswers, expiresAt, randomizeOptions,
}: Props) {
  const router = useRouter();

  // Random options (hanya sekali saat mount)
  const questions = useMemo(() => {
    if (!randomizeOptions) return rawQuestions;
    return rawQuestions.map((q) => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5),
    }));
  }, [rawQuestions, randomizeOptions]);

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(initialAnswers);
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });
  const [showSubmit, setShowSubmit] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [violations, setViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const submittedRef = useRef(false);

  // Auto-submit helper
  const autoSubmit = useRef(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    await submitExam(examId, true);
    router.push(`/student/exams/${examId}/finish`);
  });

  // ===== ANTI-CHEAT =====
  useEffect(() => {
    function registerViolation() {
      if (submittedRef.current) return;
      setViolations((v) => {
        const next = v + 1;
        if (next >= MAX_VIOLATIONS) {
          void autoSubmit.current();
        } else {
          setShowWarning(true);
        }
        return next;
      });
    }
    function onVisibility() {
      if (document.hidden) registerViolation();
    }
    function onBlur() {
      // pindah ke aplikasi/jendela lain
      registerViolation();
    }
    function blockContext(e: Event) { e.preventDefault(); }
    function blockCopy(e: Event) { e.preventDefault(); }
    function blockKeys(e: KeyboardEvent) {
      // blok copy/paste/cut/print/save & devtools umum
      if ((e.ctrlKey || e.metaKey) && ["c", "v", "x", "p", "s", "u"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("contextmenu", blockContext);
    document.addEventListener("copy", blockCopy);
    document.addEventListener("cut", blockCopy);
    document.addEventListener("keydown", blockKeys);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("contextmenu", blockContext);
      document.removeEventListener("copy", blockCopy);
      document.removeEventListener("cut", blockCopy);
      document.removeEventListener("keydown", blockKeys);
    };
  }, []);

  // Timer + auto submit
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          if (!submittedRef.current) {
            submittedRef.current = true;
            (async () => {
              await submitExam(examId, true);
              router.push(`/student/exams/${examId}/finish`);
            })();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [examId, router]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const isWarning = timeLeft < 10 * 60;
  const isCritical = timeLeft < 3 * 60;

  // Save helper (autosave)
  async function persistAnswer(questionId: string, state: AnswerState) {
    setAnswers((p) => ({ ...p, [questionId]: state }));
    try {
      await saveAnswer({
        examId, questionId,
        selectedOptionId: state.selectedOptionId,
        answerText: state.answerText,
        isDoubtful: state.isDoubtful,
      });
    } catch {
      // silent fail; akan retry saat user pilih lagi
    }
  }

  function selectOption(qId: string, optId: string) {
    const cur = answers[qId] ?? { isDoubtful: false };
    void persistAnswer(qId, { ...cur, selectedOptionId: optId, answerText: null });
  }

  function setText(qId: string, text: string) {
    const cur = answers[qId] ?? { isDoubtful: false };
    setAnswers((p) => ({ ...p, [qId]: { ...cur, answerText: text } }));
  }

  // Debounce save text answers
  const textSaveTimer = useRef<Record<string, NodeJS.Timeout>>({});
  function setTextDebounced(qId: string, text: string) {
    setText(qId, text);
    clearTimeout(textSaveTimer.current[qId]);
    textSaveTimer.current[qId] = setTimeout(() => {
      const cur = answers[qId] ?? { isDoubtful: false };
      void persistAnswer(qId, { ...cur, answerText: text, selectedOptionId: null });
    }, 800);
  }

  function toggleDoubtful(qId: string) {
    const cur = answers[qId] ?? { isDoubtful: false };
    void persistAnswer(qId, { ...cur, isDoubtful: !cur.isDoubtful });
  }

  function getNumColor(idx: number): string {
    const q = questions[idx];
    const a = answers[q.id];
    if (idx === currentQ) return "bg-blue-600 text-white border-blue-600";
    if (a?.isDoubtful) return "bg-yellow-400 text-white border-yellow-400";
    if (a && (a.selectedOptionId || a.answerText)) return "bg-green-500 text-white border-green-500";
    return "bg-white text-gray-600 border-gray-300";
  }

  const answered = Object.entries(answers).filter(([, a]) => !a.isDoubtful && (a.selectedOptionId || a.answerText)).length;
  const doubtful = Object.values(answers).filter((a) => a.isDoubtful).length;
  const unanswered = questions.length - answered - doubtful;
  const progress = questions.length > 0 ? ((answered + doubtful) / questions.length) * 100 : 0;
  const q = questions[currentQ];
  const currentAnswer = q ? answers[q.id] : undefined;

  async function handleSubmit() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    await submitExam(examId, false);
    router.push(`/student/exams/${examId}/finish`);
  }

  if (!q) return null;

  const NumberGrid = () => (
    <div>
      <p className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Navigasi Soal</p>
      <div className="mb-3 flex flex-wrap gap-1.5 text-xs">
        {[
          { color: "bg-blue-600", label: "Sedang dibuka" },
          { color: "bg-green-500", label: "Sudah dijawab" },
          { color: "bg-yellow-400", label: "Ragu-ragu" },
          { color: "bg-white border border-gray-300", label: "Belum dijawab" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <div className={`h-3 w-3 rounded-sm ${l.color}`} />
            <span className="text-gray-500">{l.label}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {questions.map((_, idx) => (
          <button
            key={idx}
            onClick={() => { setCurrentQ(idx); setNavOpen(false); }}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-bold transition-all hover:scale-105 ${getNumColor(idx)}`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-1 text-xs text-gray-500">
        <div className="flex justify-between"><span>Dijawab:</span><span className="font-semibold text-green-600">{answered}</span></div>
        <div className="flex justify-between"><span>Ragu-ragu:</span><span className="font-semibold text-yellow-600">{doubtful}</span></div>
        <div className="flex justify-between"><span>Belum:</span><span className="font-semibold text-gray-600">{unanswered}</span></div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      <header className={`z-20 flex items-center justify-between border-b px-3 py-2 shadow-sm transition-colors ${isCritical ? "bg-red-600" : isWarning ? "bg-blue-500" : "bg-white"}`}>
        <div className={`text-sm font-medium ${isCritical || isWarning ? "text-white" : "text-gray-700"}`}>
          <span className="font-semibold">{subjectCode}</span>
          <span className="mx-2 opacity-40">·</span>
          <span className="text-xs opacity-75 truncate max-w-[200px] inline-block align-bottom">{title}</span>
        </div>
        <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-lg font-bold ${isCritical ? "bg-red-700 text-white" : isWarning ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}>
          <Clock className="h-4 w-4" />{formatTime(timeLeft)}
        </div>
        <div className="flex items-center gap-2">
          {violations > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
              <ShieldAlert className="h-3.5 w-3.5" />{violations}/{MAX_VIOLATIONS}
            </span>
          )}
          <Progress value={progress} className="hidden w-24 sm:block h-2" />
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                <Grid3X3 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Soal</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-4"><NumberGrid /></SheetContent>
          </Sheet>
          <Button size="sm" className="gap-1.5 h-8 bg-red-500 hover:bg-red-600 text-xs" onClick={() => setShowSubmit(true)}>
            <Send className="h-3.5 w-3.5" /><span className="hidden sm:inline">Selesai</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-2xl">
            <div className="mb-4 flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">Soal {currentQ + 1} dari {questions.length}</Badge>
              <button
                onClick={() => toggleDoubtful(q.id)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  currentAnswer?.isDoubtful ? "border-yellow-400 bg-yellow-50 text-yellow-700" : "border-gray-200 text-gray-500 hover:border-yellow-400 hover:text-yellow-600"
                }`}
              >
                <Flag className="h-3.5 w-3.5" />
                {currentAnswer?.isDoubtful ? "Tandai Ragu" : "Ragu-ragu"}
              </button>
            </div>

            <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm select-none">
              <p className="text-sm font-semibold text-gray-500 mb-2">Pertanyaan {currentQ + 1}</p>
              <MathText text={q.questionText} className="block text-gray-900 leading-relaxed" />
            </div>

            {/* Render input sesuai jenis soal */}
            {(q.questionType === "MULTIPLE_CHOICE" || q.questionType === "TRUE_FALSE" || q.questionType === "MULTIPLE_CHOICE_COMPLEX") && (
              <div className="space-y-2.5">
                {q.options.map((opt) => {
                  const selected = currentAnswer?.selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => selectOption(q.id, opt.id)}
                      className={`group flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                        selected ? "border-blue-500 bg-blue-50 shadow-sm" : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
                      }`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                        selected ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300 text-gray-500 group-hover:border-blue-400"
                      }`}>
                        {selected ? <CheckCircle className="h-4 w-4" /> : opt.label}
                      </div>
                      <MathText text={opt.text} className={`text-sm ${selected ? "font-medium text-blue-800" : "text-gray-700"}`} />
                    </button>
                  );
                })}
              </div>
            )}

            {(q.questionType === "ESSAY" || q.questionType === "SHORT_ANSWER") && (
              <Textarea
                value={currentAnswer?.answerText ?? ""}
                onChange={(e) => setTextDebounced(q.id, e.target.value)}
                placeholder={q.questionType === "ESSAY" ? "Tulis jawaban esai Anda di sini..." : "Tulis jawaban singkat..."}
                className={`bg-white ${q.questionType === "ESSAY" ? "min-h-48" : "min-h-20"}`}
                rows={q.questionType === "ESSAY" ? 8 : 3}
              />
            )}

            <div className="mt-6 flex justify-between">
              <Button variant="outline" className="gap-2" onClick={() => setCurrentQ((p) => Math.max(0, p - 1))} disabled={currentQ === 0}>
                <ChevronLeft className="h-4 w-4" />Sebelumnya
              </Button>
              {currentQ < questions.length - 1 ? (
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setCurrentQ((p) => p + 1)}>
                  Selanjutnya<ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button className="gap-2 bg-red-500 hover:bg-red-600" onClick={() => setShowSubmit(true)}>
                  <Send className="h-4 w-4" />Selesai Ujian
                </Button>
              )}
            </div>
          </div>
        </div>

        <aside className="hidden w-56 shrink-0 overflow-y-auto border-l bg-white p-4 lg:block">
          <NumberGrid />
        </aside>
      </div>

      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="h-5 w-5" />Peringatan Pelanggaran
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-gray-600">
              Anda terdeteksi meninggalkan halaman ujian (pindah tab/aplikasi). Tetap berada di halaman ujian hingga selesai.
            </p>
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              Pelanggaran ke-<b>{violations}</b> dari {MAX_VIOLATIONS}. Setelah {MAX_VIOLATIONS} kali, ujian akan otomatis dikumpulkan.
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setShowWarning(false)}>
              Saya Mengerti
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubmit} onOpenChange={setShowSubmit}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />Konfirmasi Submit Ujian
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl border bg-gray-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Total soal</span><span className="font-semibold">{questions.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Sudah dijawab</span><span className="font-semibold text-green-600">{answered}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Ragu-ragu</span><span className="font-semibold text-yellow-600">{doubtful}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Belum dijawab</span><span className="font-semibold text-red-500">{unanswered}</span></div>
            </div>
            {unanswered > 0 && (
              <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                Masih ada {unanswered} soal yang belum dijawab. Yakin ingin submit?
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowSubmit(false)} disabled={submitting}>Kembali</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Mengirim..." : "Ya, Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
