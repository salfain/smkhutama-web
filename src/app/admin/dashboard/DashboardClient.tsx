"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, GraduationCap, Building2, BookOpen, FileText,
  MonitorCheck, CheckCircle, Clock, TrendingUp, BarChart3,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

type Props = {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    totalSubjects: number;
    totalQuestions: number;
    activeExams: number;
    inProgressAttempts: number;
    submittedAttempts: number;
  };
  recentExams: {
    id: string;
    title: string;
    status: string;
    subject: { name: string };
    teacher: { user: { name: string } };
    _count: { attempts: number };
  }[];
  scoreChartData: { mapel: string; nilai: number }[];
  schoolName: string;
  activeYear: string;
};

const statusStyle: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  DRAFT: "bg-yellow-100 text-yellow-700 border-yellow-200",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
};
const statusLabel: Record<string, string> = {
  ACTIVE: "Aktif", DRAFT: "Draft", CLOSED: "Selesai",
};

export function DashboardClient({ stats, recentExams, scoreChartData, schoolName, activeYear }: Props) {
  const statCards = [
    { title: "Total Siswa", value: stats.totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50", change: "Terdaftar" },
    { title: "Total Guru", value: stats.totalTeachers, icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-50", change: "Aktif" },
    { title: "Total Kelas", value: stats.totalClasses, icon: Building2, color: "text-purple-600", bg: "bg-purple-50", change: "Kelas" },
    { title: "Mata Pelajaran", value: stats.totalSubjects, icon: BookOpen, color: "text-orange-600", bg: "bg-orange-50", change: activeYear },
    { title: "Bank Soal", value: stats.totalQuestions, icon: FileText, color: "text-cyan-600", bg: "bg-cyan-50", change: "Aktif" },
    { title: "Ujian Aktif", value: stats.activeExams, icon: MonitorCheck, color: "text-red-600", bg: "bg-red-50", change: "Berlangsung" },
    { title: "Sedang Ujian", value: stats.inProgressAttempts, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50", change: "Online" },
    { title: "Ujian Selesai", value: stats.submittedAttempts, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", change: "Tersubmit" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-sm text-gray-500">{schoolName} · {activeYear}</p>
        </div>
        <Badge className="w-fit bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
          ● Sistem Online
        </Badge>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.title} className="border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">{s.title}</p>
                  <p className="mt-1 font-heading text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{s.change}</p>
                </div>
                <div className={`rounded-lg p-2 ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Rata-rata Nilai per Mata Pelajaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scoreChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scoreChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mapel" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="nilai" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Rata-rata" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
                Belum ada data nilai
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              Ujian Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentExams.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
                Belum ada ujian dibuat
              </div>
            ) : (
              <div className="space-y-2">
                {recentExams.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg border p-2.5 hover:bg-gray-50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{e.title}</p>
                      <p className="text-xs text-gray-400">{e.teacher.user.name} · {e._count.attempts} peserta</p>
                    </div>
                    <Badge className={`shrink-0 ml-2 text-xs hover:opacity-100 ${statusStyle[e.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {statusLabel[e.status] ?? e.status}
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
