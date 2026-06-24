import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CalendarDays, FileText, Image, Music, UserRound, Video } from "lucide-react";
import { QuestionSetPrintActions } from "./QuestionSetPrintActions";

type QuestionOption = {
  id: string;
  optionLabel: string;
  optionText: string;
  mediaUrl: string | null;
  isCorrect: boolean;
  orderNumber: number;
};

type Question = {
  id: string;
  questionType: string;
  questionText: string;
  mediaType: string;
  mediaUrl: string | null;
  difficulty: string;
  material: string | null;
  grade: string | null;
  isRandomized: boolean;
  randomizeOptions: boolean;
  options: QuestionOption[];
};

type QuestionSetDetail = {
  id: string;
  title: string;
  description: string | null;
  examType: string;
  grade: string | null;
  source: string;
  status: string;
  sourceFileName: string | null;
  totalQuestions: number;
  multipleChoiceCount: number;
  essayCount: number;
  invalidCount: number;
  createdAt: Date;
  subject: { code: string; name: string };
  ownerTeacher: { user: { name: string } };
  questions: Question[];
  _count?: { exams?: number };
};

const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Diajukan",
  APPROVED: "Disetujui",
  USED: "Dipakai",
};

const questionTypeLabel: Record<string, string> = {
  MULTIPLE_CHOICE: "Pilihan Ganda",
  ESSAY: "Esai",
  SHORT_ANSWER: "Isian",
  TRUE_FALSE: "Benar/Salah",
  MULTIPLE_CHOICE_COMPLEX: "PG Kompleks",
  MATCHING: "Menjodohkan",
};

const difficultyLabel: Record<string, string> = {
  EASY: "Mudah",
  MEDIUM: "Sedang",
  HARD: "Sulit",
};

function MediaBadge({ mediaType, mediaUrl }: { mediaType: string; mediaUrl: string | null }) {
  if (mediaType === "NONE" || !mediaUrl) return null;
  const Icon = mediaType === "IMAGE" ? Image : mediaType === "AUDIO" ? Music : Video;
  return (
    <Badge variant="secondary" className="gap-1">
      <Icon className="h-3 w-3" />
      {mediaType}
    </Badge>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-white/20 bg-white/15 p-3 text-center text-white shadow-sm backdrop-blur">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-blue-50">{label}</p>
    </div>
  );
}

export function QuestionSetDetailView({
  questionSet,
  backHref,
  backLabel,
}: {
  questionSet: QuestionSetDetail;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="question-set-print-root p-4 md:p-6 lg:p-8">
      <div className="mb-5 print:hidden">
        <Button asChild variant="ghost" size="sm" className="mb-3 gap-1 text-gray-600">
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </Button>

        <div className="overflow-hidden rounded-xl bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600 text-white shadow-lg">
          <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between md:p-6">
            <div className="max-w-3xl">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge className="bg-white/15 text-white hover:bg-white/15">Paket Bank Soal</Badge>
                <Badge className="bg-white text-blue-700 hover:bg-white">
                  {statusLabel[questionSet.status] ?? questionSet.status}
                </Badge>
              </div>
              <h1 className="font-heading text-2xl font-bold md:text-3xl">{questionSet.title}</h1>
              <p className="mt-2 text-sm text-blue-50">
                {questionSet.subject.code} - {questionSet.subject.name} - {questionSet.examType}
                {questionSet.grade ? ` - ${questionSet.grade}` : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-blue-50">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
                  <UserRound className="h-3.5 w-3.5" />
                  {questionSet.ownerTeacher.user.name}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(questionSet.createdAt).toLocaleDateString("id-ID")}
                </span>
              </div>
            </div>
            <div className="shrink-0">
              <QuestionSetPrintActions />
              <p className="mt-2 text-center text-xs text-blue-100">Pilih Save as PDF pada dialog cetak</p>
            </div>
          </div>

          <div className="grid gap-3 border-t border-white/15 bg-white/10 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Total Soal" value={questionSet.totalQuestions} />
            <Stat label="Pilihan Ganda" value={questionSet.multipleChoiceCount} />
            <Stat label="Esai" value={questionSet.essayCount} />
            <Stat label="Baris Gagal" value={questionSet.invalidCount} />
            <Stat label="Dipakai Ujian" value={questionSet._count?.exams ?? 0} />
          </div>
        </div>
      </div>

      <div className="question-set-print-only hidden print:block">
        <div className="border-b-2 border-gray-900 pb-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-500">Paket Bank Soal</p>
          <h1 className="mt-2 text-xl font-bold uppercase text-gray-950">{questionSet.title}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {questionSet.subject.name} ({questionSet.subject.code}) - {questionSet.examType}
            {questionSet.grade ? ` - ${questionSet.grade}` : ""}
          </p>
        </div>

        <div className="my-4 grid grid-cols-4 gap-2 text-center text-xs">
          <div className="rounded border border-gray-300 p-2"><strong>{questionSet.totalQuestions}</strong><br />Total Soal</div>
          <div className="rounded border border-gray-300 p-2"><strong>{questionSet.multipleChoiceCount}</strong><br />Pilihan Ganda</div>
          <div className="rounded border border-gray-300 p-2"><strong>{questionSet.essayCount}</strong><br />Esai</div>
          <div className="rounded border border-gray-300 p-2"><strong>{statusLabel[questionSet.status] ?? questionSet.status}</strong><br />Status</div>
        </div>
      </div>

      <Card className="question-set-screen-card mb-5 border shadow-sm">
        <CardContent className="grid gap-3 p-4 text-sm md:grid-cols-2">
          <div><span className="text-gray-500">Guru pemilik:</span> <span className="font-medium">{questionSet.ownerTeacher.user.name}</span></div>
          <div><span className="text-gray-500">Sumber:</span> <span className="font-medium">{questionSet.source === "ADMIN_IMPORT" ? "Import Admin" : "Import Guru"}</span></div>
          <div><span className="text-gray-500">File:</span> <span className="font-medium">{questionSet.sourceFileName ?? "-"}</span></div>
          <div><span className="text-gray-500">Tanggal import:</span> <span className="font-medium">{new Date(questionSet.createdAt).toLocaleString("id-ID")}</span></div>
          {questionSet.description && (
            <div className="md:col-span-2"><span className="text-gray-500">Catatan:</span> <span className="font-medium">{questionSet.description}</span></div>
          )}
        </CardContent>
      </Card>

      <Card className="question-set-print-paper border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FileText className="h-4 w-4 text-blue-600" />
            Preview Soal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {questionSet.questions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-400">
              Tidak ada soal dalam paket ini.
            </div>
          ) : questionSet.questions.map((question, index) => (
            <div key={question.id} className="question-set-question rounded-lg border p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">No. {index + 1}</Badge>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  {questionTypeLabel[question.questionType] ?? question.questionType}
                </Badge>
                <Badge variant="outline">{difficultyLabel[question.difficulty] ?? question.difficulty}</Badge>
                <Badge variant="outline">{question.isRandomized ? "Acak" : "Prioritas"}</Badge>
                {question.questionType === "MULTIPLE_CHOICE" && (
                  <Badge variant="outline">{question.randomizeOptions ? "Opsi acak" : "Opsi tetap"}</Badge>
                )}
                <MediaBadge mediaType={question.mediaType} mediaUrl={question.mediaUrl} />
              </div>

              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-900">
                {question.questionText}
              </div>

              {question.mediaUrl && (
                <p className="mt-2 break-all rounded bg-gray-50 px-3 py-2 text-xs text-gray-500">
                  Media soal: {question.mediaUrl}
                </p>
              )}

              {question.options.length > 0 && (
                <div className="mt-3 space-y-2">
                  {question.options.map((option) => (
                    <div
                      key={option.id}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        option.isCorrect ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "bg-white"
                      }`}
                    >
                      <div className="flex gap-2">
                        <span className="font-bold">{option.optionLabel}.</span>
                        <span className="flex-1 whitespace-pre-wrap">{option.optionText || "-"}</span>
                        {option.isCorrect && <Badge className="bg-emerald-600 hover:bg-emerald-600">Kunci</Badge>}
                      </div>
                      {option.mediaUrl && (
                        <p className="mt-1 break-all text-xs text-gray-500">Media opsi: {option.mediaUrl}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {(question.material || question.grade) && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                  {question.material && <span>Materi: {question.material}</span>}
                  {question.grade && <span>Tingkat: {question.grade}</span>}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
