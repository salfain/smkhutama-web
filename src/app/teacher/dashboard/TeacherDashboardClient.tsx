"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText, ClipboardList, CheckSquare, Users, BarChart3, ArrowRight, MonitorCheck, Upload,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type Data = {
  totalQuestions: number;
  totalExams: number;
  activeExams: number;
  closedExams: number;
  totalParticipants: number;
  pendingEssays: number;
  scoreByClass: { kelas: string; rata: number }[];
  recentExams: {
    id: string;
    title: string;
    status: string;
    startAt: Date;
    subject: { code: string };
    _count: { attempts: number };
  }[];
};

const statusStyle: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  DRAFT:  "bg-yellow-100 text-yellow-700 border-yellow-200",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
};

export function TeacherDashboardClient({
  teacherName, subjectName, data,
}: { teacherName: string; subjectName: string; data: Data | null }) {
  const d = data ?? {
    totalQuestions: 0, totalExams: 0, activeExams: 0, closedExams: 0,
    totalParticipants: 0, pendingEssays: 0,
    scoreByClass: [], recentExams: [],
  };

  const stats = [
    { title: "Paket Bank Soal", value: d.totalQuestions,    icon: FileText,     color: "text-blue-600",    bg: "bg-blue-50" },
    { title: "Total Ujian",     value: d.totalExams,        icon: ClipboardList, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Esai Belum Dikoreksi", value: d.pendingEssays, icon: CheckSquare, color: "text-blue-600",  bg: "bg-blue-50" },
    { title: "Total Peserta",   value: d.totalParticipants, icon: Users,        color: "text-purple-600",  bg: "bg-purple-50" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Dashboard Guru</h1>
          <p className="text-sm text-gray-500">Selamat datang, {teacherName} · Mata Pelajaran: {subjectName}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/teacher/question-sets">
            <Button size="sm" variant="outline" className="gap-1.5"><Upload className="h-4 w-4" />Import Paket Soal</Button>
          </Link>
          <Link href="/teacher/monitoring">
            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"><MonitorCheck className="h-4 w-4" />Monitoring</Button>
          </Link>
        </div>
      </div>

      {d.pendingEssays > 0 && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <CheckSquare className="h-4 w-4" />
            <span>Ada <strong>{d.pendingEssays} jawaban esai</strong> yang belum dikoreksi</span>
          </div>
          <Link href="/teacher/essay-grading">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1">Koreksi <ArrowRight className="h-3.5 w-3.5" /></Button>
          </Link>
        </div>
      )}

      <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.title} className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">{s.title}</p>
                  <p className="mt-1 font-heading text-2xl font-bold text-gray-900">{s.value}</p>
                </div>
                <div className={`rounded-lg p-2 ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <BarChart3 className="h-4 w-4 text-emerald-600" />Rata-rata Nilai per Kelas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d.scoreByClass.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">Belum ada data nilai</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={d.scoreByClass}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="kelas" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="rata" fill="#10b981" radius={[4, 4, 0, 0]} name="Rata-rata" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Ujian Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {d.recentExams.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">Belum ada ujian</div>
            ) : (
              <div className="space-y-3">
                {d.recentExams.map((e) => (
                  <div key={e.id} className="flex items-start justify-between gap-3 rounded-lg border p-3 hover:bg-gray-50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{e.title}</p>
                      <p className="text-xs text-gray-400">{e.subject.code} · {e._count.attempts} peserta · {new Date(e.startAt).toLocaleDateString("id-ID")}</p>
                    </div>
                    <Badge className={`shrink-0 text-xs hover:opacity-100 ${statusStyle[e.status] ?? "bg-gray-100"}`}>
                      {e.status === "ACTIVE" ? "Aktif" : e.status === "DRAFT" ? "Draft" : "Selesai"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
