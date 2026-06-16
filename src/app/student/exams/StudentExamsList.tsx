"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Clock, BookOpen, CalendarDays, ArrowRight, CheckCircle, Lock, Filter,
} from "lucide-react";
import { EXAM_TYPES, getExamTypeInfo } from "@/lib/exam-types";

type Exam = {
  id: string;
  title: string;
  examType: "UH" | "UTS" | "UAS" | "US" | "TRYOUT" | "LAINNYA";
  status: "DRAFT" | "ACTIVE" | "CLOSED";
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  subject: { code: string; name: string };
  _count: { questions: number };
  attempt: { status: string } | null;
};

export function StudentExamsList({ exams }: { exams: Exam[] }) {
  const [filterType, setFilterType] = useState<string>("all");
  const now = new Date();

  const filtered = exams.filter((e) => filterType === "all" || e.examType === filterType);

  // Group by examType for "all" view
  const grouped = filterType === "all"
    ? EXAM_TYPES
        .map((t) => ({ type: t, items: filtered.filter((e) => e.examType === t.value) }))
        .filter((g) => g.items.length > 0)
    : null;

  if (exams.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
        <BookOpen className="mx-auto mb-2 h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-500">Belum ada ujian yang ditugaskan untuk kelas Anda</p>
      </div>
    );
  }

  return (
    <>
      {/* Filter */}
      <div className="mb-4 flex items-center gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-56">
            <Filter className="mr-2 h-4 w-4 text-gray-400" />
            <SelectValue placeholder="Filter jenis ujian" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis Ujian</SelectItem>
            {EXAM_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.short} – {t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-gray-400">{filtered.length} ujian</span>
      </div>

      {/* List */}
      {grouped ? (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.type.value}>
              <div className="mb-2 flex items-center gap-2">
                <Badge className={`text-xs hover:opacity-100 ${g.type.color}`}>{g.type.short}</Badge>
                <p className="text-xs font-semibold text-gray-500 uppercase">{g.type.label}</p>
                <span className="text-xs text-gray-400">· {g.items.length} ujian</span>
              </div>
              <div className="space-y-3">
                {g.items.map((exam) => <ExamCard key={exam.id} exam={exam} now={now} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((exam) => <ExamCard key={exam.id} exam={exam} now={now} />)}
        </div>
      )}
    </>
  );
}

function ExamCard({ exam, now }: { exam: Exam; now: Date }) {
  const typeInfo = getExamTypeInfo(exam.examType);
  const attempt = exam.attempt;
  const isDone = attempt && (attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED");
  const isInProgress = attempt && attempt.status === "IN_PROGRESS";
  const isAvailable = exam.status === "ACTIVE" &&
                      new Date(exam.startAt) <= now &&
                      new Date(exam.endAt) >= now;
  const isUpcoming = new Date(exam.startAt) > now;

  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${isAvailable && !isDone ? "border-green-200 shadow-green-50" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900">{exam.title}</p>
            <Badge className={`text-xs hover:opacity-100 ${typeInfo.color}`}>{typeInfo.short}</Badge>
            <Badge variant="secondary" className="text-xs">{exam.subject.code}</Badge>
            {isDone && <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 text-xs">Sudah Dikerjakan</Badge>}
            {isInProgress && <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100 text-xs">Sedang Dikerjakan</Badge>}
            {isAvailable && !attempt && <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-xs">● Tersedia</Badge>}
            {isUpcoming && <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 text-xs">Akan Datang</Badge>}
          </div>
          <p className="text-sm text-gray-500 mb-2">{exam.subject.name}</p>
          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{new Date(exam.startAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(exam.startAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
            <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{exam._count.questions} soal · {exam.durationMinutes} menit</span>
          </div>
        </div>
        <div className="shrink-0">
          {isDone && (
            <Link href="/student/results">
              <Button variant="outline" size="sm" className="gap-1.5 text-blue-600">
                <CheckCircle className="h-3.5 w-3.5" />Lihat Nilai
              </Button>
            </Link>
          )}
          {isInProgress && (
            <Link href={`/student/exams/${exam.id}/test`}>
              <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 gap-1.5">
                Lanjutkan <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
          {isAvailable && !attempt && (
            <Link href={`/student/exams/${exam.id}/token`}>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1.5">
                Masuk Ujian <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
          {(isUpcoming || (!isAvailable && !attempt)) && (
            <Button variant="outline" size="sm" disabled className="gap-1.5">
              <Lock className="h-3.5 w-3.5" />Belum Tersedia
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
