"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar, Clock, FileText, Users, MonitorCheck,
} from "lucide-react";
import { getExamTypeInfo } from "@/lib/exam-types";

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
  DRAFT: "bg-yellow-100 text-yellow-700 border-yellow-200",
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
  return (
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
                    {statusLabel[e.status]}
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
              {e.status === "ACTIVE" && (
                <Link href="/teacher/monitoring">
                  <Button variant="outline" size="sm" className="gap-1 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                    <MonitorCheck className="h-3.5 w-3.5" />Monitoring
                  </Button>
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
