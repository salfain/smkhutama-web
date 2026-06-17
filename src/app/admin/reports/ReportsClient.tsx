"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download, Users, Building2, BookOpen, FileText, ClipboardList, BarChart3,
} from "lucide-react";
import { exportExamScores, exportAttendance, exportClassRecap } from "./actions";

type Stats = {
  totalExams: number;
  activeExams: number;
  closedExams: number;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  totalQuestions: number;
};

type RecentExam = {
  id: string;
  title: string;
  endAt: Date;
  passingScore: number | null;
  subject: { code: string; name: string };
  teacher: { user: { name: string } };
  classes: { class: { name: string } }[];
  _count: { attempts: number };
};

export function ReportsClient({ stats, recentClosed }: { stats: Stats; recentClosed: RecentExam[] }) {
  const [pending, startTransition] = useTransition();

  function downloadBlob(data: number[], filename: string) {
    const blob = new Blob([new Uint8Array(data)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportScores(examId: string) {
    startTransition(async () => {
      const r = await exportExamScores(examId);
      if ("error" in r) alert(r.error);
      else downloadBlob(r.data, r.filename);
    });
  }

  function handleExportAttendance(examId: string) {
    startTransition(async () => {
      const r = await exportAttendance(examId);
      if ("error" in r) alert(r.error);
      else downloadBlob(r.data, r.filename);
    });
  }

  function handleExportRecap() {
    startTransition(async () => {
      const r = await exportClassRecap();
      downloadBlob(r.data, r.filename);
    });
  }

  const summaryCards = [
    { label: "Total Ujian", value: stats.totalExams, sub: `${stats.activeExams} aktif · ${stats.closedExams} selesai`, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Siswa", value: stats.totalStudents, sub: "siswa terdaftar", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Guru", value: stats.totalTeachers, sub: "guru aktif", icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Kelas", value: stats.totalClasses, sub: `${stats.totalSubjects} mata pelajaran`, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  return (
    <>
      {/* Summary */}
      <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
        {summaryCards.map((s) => (
          <Card key={s.label} className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="mt-1 font-heading text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{s.sub}</p>
                </div>
                <div className={`rounded-lg p-2 ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick exports */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="mb-3 flex items-start justify-between">
              <div className="rounded-lg p-2.5 bg-blue-50">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Rekap Nilai per Kelas</h3>
            <p className="text-xs text-gray-500 mb-4">Export rata-rata nilai seluruh siswa per kelas</p>
            <Button size="sm" className="w-full gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={handleExportRecap} disabled={pending}>
              <Download className="h-3.5 w-3.5" />Export Excel
            </Button>
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="mb-3 flex items-start justify-between">
              <div className="rounded-lg p-2.5 bg-purple-50">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <Badge variant="secondary" className="text-xs">{stats.totalQuestions}</Badge>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Bank Soal</h3>
            <p className="text-xs text-gray-500 mb-4">{stats.totalQuestions} soal aktif tersimpan di sistem</p>
            <Button size="sm" variant="outline" className="w-full gap-1.5" disabled>
              Detail di Bank Soal
            </Button>
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="mb-3 flex items-start justify-between">
              <div className="rounded-lg p-2.5 bg-emerald-50">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <Badge variant="secondary" className="text-xs">{stats.totalStudents}</Badge>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Data Siswa</h3>
            <p className="text-xs text-gray-500 mb-4">Export di halaman Data Siswa</p>
            <a href="/admin/students">
              <Button size="sm" variant="outline" className="w-full gap-1.5">
                <Download className="h-3.5 w-3.5" />Buka Data Siswa
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Per-exam reports */}
      <Card className="border shadow-sm">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Rekap per Ujian</p>
              <p className="text-xs text-gray-500">Download nilai dan daftar hadir per ujian yang sudah selesai</p>
            </div>
          </div>

          {recentClosed.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
              <ClipboardList className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">Belum ada ujian yang selesai (status CLOSED)</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentClosed.map((e) => (
                <div key={e.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="font-mono text-xs">{e.subject.code}</Badge>
                      <p className="text-sm font-medium text-gray-900">{e.title}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {e.teacher.user.name} · {e._count.attempts} peserta · Selesai {new Date(e.endAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleExportAttendance(e.id)} disabled={pending}>
                      <Download className="h-3 w-3" />Hadir
                    </Button>
                    <Button size="sm" className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => handleExportScores(e.id)} disabled={pending}>
                      <Download className="h-3 w-3" />Nilai
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
