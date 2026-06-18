"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Eye, EyeOff, ArrowLeft, Key } from "lucide-react";

type Option = { id: string; optionLabel: string; optionText: string; isCorrect: boolean };
type Question = {
  no: number; id: string; questionText: string; questionType: string;
  mediaType: string; mediaUrl: string | null; explanation: string | null;
  options: Option[];
};
type ExamData = {
  exam: {
    id: string; title: string; examType: string; durationMinutes: number;
    startAt: Date; passingScore: number | null;
    subject: { name: string; code: string };
    teacherName: string;
    academicYear: { year: string; semester: string } | null;
    classNames: string[];
  };
  questions: Question[];
  school: { name: string | null; address: string | null; npsn: string | null } | null;
};

const examTypeLabel: Record<string, string> = {
  UH: "Ulangan Harian", UTS: "Ujian Tengah Semester",
  UAS: "Ujian Akhir Semester", US: "Ujian Sekolah",
  TRYOUT: "Tryout / Latihan", LAINNYA: "Lainnya",
};

const qTypeLabel: Record<string, string> = {
  MULTIPLE_CHOICE: "PG", MULTIPLE_CHOICE_COMPLEX: "PGK",
  TRUE_FALSE: "B/S", MATCHING: "Menjodohkan",
  SHORT_ANSWER: "Isian", ESSAY: "Esai",
};

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export function PrintQuestionsClient({
  data, showKey: initialShowKey, examId,
}: { data: ExamData; showKey: boolean; examId: string }) {
  const [showKey, setShowKey] = useState(initialShowKey);
  const { exam, questions, school } = data;

  const mcTypes = ["MULTIPLE_CHOICE", "MULTIPLE_CHOICE_COMPLEX", "TRUE_FALSE"];
  const mcQuestions = questions.filter((q) => mcTypes.includes(q.questionType));
  const essayQuestions = questions.filter((q) => !mcTypes.includes(q.questionType));

  return (
    <>
      {/* Toolbar — disembunyikan saat print */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />Kembali
        </button>
        <div className="flex-1" />
        <Badge variant="secondary">{questions.length} soal</Badge>
        <Button
          variant="outline" size="sm"
          className="gap-1.5"
          onClick={() => setShowKey((v) => !v)}
        >
          {showKey ? <EyeOff className="h-4 w-4" /> : <Key className="h-4 w-4" />}
          {showKey ? "Sembunyikan Kunci" : "Tampilkan Kunci"}
        </Button>
        <Button
          size="sm"
          className="gap-1.5 bg-blue-600 hover:bg-blue-700"
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4" />Cetak / Simpan PDF
        </Button>
      </div>

      {/* Konten A4 */}
      <div className="print:pt-0 pt-16">
        <div className="mx-auto bg-white print:shadow-none shadow-lg"
          style={{ maxWidth: "210mm", minHeight: "297mm", padding: "20mm" }}>

          {/* Header sekolah */}
          <div className="border-b-2 border-gray-800 pb-3 mb-5">
            <div className="flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/api/school/logo"
                alt="Logo"
                className="h-16 w-16 object-contain shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div className="flex-1 text-center">
                <p className="text-base font-bold uppercase tracking-wide">
                  {school?.name ?? "SMK HUTAMA"}
                </p>
                {school?.address && (
                  <p className="text-xs text-gray-600 mt-0.5">{school.address}</p>
                )}
                {school?.npsn && (
                  <p className="text-xs text-gray-500">NPSN: {school.npsn}</p>
                )}
              </div>
              <div className="w-16 shrink-0" /> {/* spacer untuk simetri */}
            </div>
          </div>

          {/* Judul ujian */}
          <div className="text-center mb-5">
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
              {examTypeLabel[exam.examType] ?? exam.examType}
            </p>
            <h1 className="text-lg font-bold uppercase mt-1">{exam.title}</h1>
            <p className="text-sm text-gray-600 mt-0.5">{exam.subject.name}</p>
          </div>

          {/* Info ujian */}
          <div className="grid grid-cols-2 gap-x-6 text-sm mb-6 border border-gray-300 rounded p-3 bg-gray-50">
            <div className="space-y-1">
              <InfoRow label="Mata Pelajaran" value={`${exam.subject.name} (${exam.subject.code})`} />
              <InfoRow label="Kelas" value={exam.classNames.join(", ") || "—"} />
              <InfoRow label="Guru" value={exam.teacherName} />
            </div>
            <div className="space-y-1">
              <InfoRow label="Hari / Tanggal" value={fmtDate(exam.startAt)} />
              <InfoRow label="Durasi" value={`${exam.durationMinutes} menit`} />
              <InfoRow label="Tahun Ajaran" value={
                exam.academicYear
                  ? `${exam.academicYear.year} ${exam.academicYear.semester === "GANJIL" ? "Ganjil" : "Genap"}`
                  : "—"
              } />
              {exam.passingScore !== null && (
                <InfoRow label="KKM" value={`${exam.passingScore}`} />
              )}
            </div>
          </div>

          {/* Petunjuk */}
          <div className="mb-6 text-xs text-gray-700">
            <p className="font-semibold mb-1">PETUNJUK PENGERJAAN:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-gray-600">
              <li>Bacalah soal dengan teliti sebelum menjawab.</li>
              <li>Berilah tanda <strong>(X)</strong> pada jawaban yang paling benar untuk soal pilihan ganda.</li>
              <li>Jawablah soal uraian dengan jelas dan lengkap.</li>
              <li>Periksa kembali jawaban Anda sebelum dikumpulkan.</li>
            </ol>
          </div>

          {/* ── Soal Pilihan Ganda ── */}
          {mcQuestions.length > 0 && (
            <div className="mb-8">
              {essayQuestions.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-bold uppercase border-b border-gray-400 pb-1">
                    A. PILIHAN GANDA
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Pilihlah jawaban yang paling tepat!
                  </p>
                </div>
              )}
              <div className="space-y-5">
                {mcQuestions.map((q) => (
                  <QuestionBlock
                    key={q.id}
                    q={q}
                    showKey={showKey}
                    isMc
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Soal Uraian / Isian ── */}
          {essayQuestions.length > 0 && (
            <div>
              {mcQuestions.length > 0 && (
                <div className="mb-4 mt-6">
                  <p className="text-sm font-bold uppercase border-b border-gray-400 pb-1">
                    B. URAIAN / ISIAN
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Jawablah dengan singkat dan jelas!
                  </p>
                </div>
              )}
              <div className="space-y-6">
                {essayQuestions.map((q) => (
                  <QuestionBlock
                    key={q.id}
                    q={q}
                    showKey={showKey}
                    isMc={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tanda tangan */}
          <div className="mt-12 pt-4 border-t border-gray-300">
            <div className="flex justify-between text-xs text-gray-600">
              <div className="text-center w-40">
                <p>Mengetahui,</p>
                <p>Kepala Sekolah</p>
                <div className="mt-10 border-b border-gray-400" />
                <p className="mt-1">( ____________________ )</p>
              </div>
              <div className="text-center w-40">
                <p>Guru Mata Pelajaran</p>
                <p className="text-gray-400">({exam.subject.code})</p>
                <div className="mt-10 border-b border-gray-400" />
                <p className="mt-1">{exam.teacherName}</p>
              </div>
            </div>
          </div>

          {/* Kunci jawaban — di halaman terpisah */}
          {showKey && mcQuestions.length > 0 && (
            <div className="mt-8 print:break-before-page">
              <div className="border-2 border-dashed border-gray-400 rounded p-4">
                <p className="text-sm font-bold text-center mb-3 uppercase tracking-wide">
                  Kunci Jawaban — {exam.title}
                </p>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  {mcQuestions.map((q) => {
                    const correctLabels = q.options
                      .filter((o) => o.isCorrect)
                      .map((o) => o.optionLabel)
                      .join(", ");
                    return (
                      <div key={q.id} className="flex gap-1.5 items-center">
                        <span className="font-semibold text-gray-700 w-6 text-right">{q.no}.</span>
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {correctLabels || "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 20mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:break-before-page { break-before: page; }
        }
      `}</style>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <span className="text-gray-500 w-28 shrink-0">{label}</span>
      <span className="text-gray-400">:</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}

function QuestionBlock({ q, showKey, isMc }: { q: Question; showKey: boolean; isMc: boolean }) {
  const isEssay = q.questionType === "ESSAY";
  const hasOptions = q.options.length > 0;

  return (
    <div className="text-sm">
      <div className="flex gap-2">
        <span className="font-semibold shrink-0 text-gray-700 w-6 text-right">{q.no}.</span>
        <div className="flex-1 min-w-0">
          {/* Teks soal */}
          <p className="leading-relaxed text-gray-900 whitespace-pre-wrap">{q.questionText}</p>

          {/* Gambar (jika ada) */}
          {q.mediaType === "IMAGE" && q.mediaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={q.mediaUrl} alt={`Soal ${q.no}`}
              className="mt-2 max-h-40 object-contain"
            />
          )}

          {/* Opsi pilihan ganda */}
          {hasOptions && (
            <div className="mt-2 space-y-1">
              {q.options.map((opt) => {
                const isCorrect = opt.isCorrect && showKey;
                return (
                  <div
                    key={opt.id}
                    className={`flex gap-2 items-start ${isCorrect ? "text-blue-700 font-semibold" : "text-gray-800"}`}
                  >
                    <span className={`shrink-0 w-5 text-right ${isCorrect ? "text-blue-700" : "text-gray-600"}`}>
                      {opt.optionLabel}.
                    </span>
                    <span className="leading-snug">{opt.optionText}</span>
                    {isCorrect && (
                      <span className="ml-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">✓ Kunci</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Garis jawaban untuk esai/isian */}
          {!hasOptions && (
            <div className="mt-3 space-y-1">
              {Array.from({ length: isEssay ? 6 : 2 }).map((_, i) => (
                <div key={i} className="border-b border-gray-300 h-5" />
              ))}
            </div>
          )}

          {/* Pembahasan (hanya muncul di kunci) */}
          {showKey && q.explanation && (
            <div className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1.5">
              <span className="font-semibold">Pembahasan: </span>
              {q.explanation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
