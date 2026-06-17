import Link from "next/link";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarDays, Clock, ClipboardCheck, ArrowRight, AlertCircle, Trophy,
} from "lucide-react";
import { getExamTypeInfo } from "@/lib/exam-types";

export const dynamic = "force-dynamic";

export default async function StudentDashboard() {
  const user = await requireAuth("STUDENT");
  if (!user.student) return null;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const classId = user.student.classId;

  const [todayExams, upcomingExams, history] = await Promise.all([
    prisma.exam.findMany({
      where: {
        status: "ACTIVE",
        startAt: { lte: todayEnd },
        endAt: { gte: now },
        ...(classId ? { classes: { some: { classId } } } : {}),
      },
      orderBy: { startAt: "asc" },
      include: {
        subject: { select: { code: true, name: true } },
        _count: { select: { questions: true } },
      },
    }),
    prisma.exam.findMany({
      where: {
        status: { in: ["ACTIVE", "DRAFT"] },
        startAt: { gt: todayEnd },
        ...(classId ? { classes: { some: { classId } } } : {}),
      },
      orderBy: { startAt: "asc" }, take: 5,
      include: { subject: { select: { code: true, name: true } } },
    }),
    prisma.studentExamAttempt.findMany({
      where: {
        studentId: user.student.id,
        status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] },
      },
      orderBy: { submittedAt: "desc" }, take: 5,
      include: { exam: { include: { subject: { select: { code: true } } } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 p-5 text-white">
        <p className="text-blue-100 text-sm">Selamat datang,</p>
        <h1 className="font-heading text-xl font-bold">{user.name}</h1>
        <p className="text-blue-100 text-sm mt-0.5">
          {user.student.class?.name ?? "Kelas belum ditentukan"}
          {user.student.nis && ` · NIS: ${user.student.nis}`} ·{" "}
          {now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Ujian Hari Ini</h2>
        </div>
        {todayExams.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-6 text-center">
            <p className="text-sm text-gray-500">Tidak ada ujian hari ini</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {todayExams.map((exam) => {
              const typeInfo = getExamTypeInfo(exam.examType);
              return (
              <Card key={exam.id} className="border shadow-sm border-green-200 overflow-hidden">
                <div className="bg-green-500 px-4 py-1 text-xs font-medium text-white">● Tersedia sekarang</div>
                <CardContent className="p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge className={`text-xs hover:opacity-100 ${typeInfo.color}`}>{typeInfo.short}</Badge>
                  </div>
                  <p className="font-semibold text-gray-900">{exam.title}</p>
                  <p className="text-sm text-gray-500 mb-3">{exam.subject.name}</p>
                  <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(exam.startAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} – 
                      {new Date(exam.endAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ClipboardCheck className="h-3.5 w-3.5" />{exam._count.questions} soal · {exam.durationMinutes} mnt
                    </div>
                  </div>
                  <Link href={`/student/exams/${exam.id}/token`}>
                    <Button className="w-full bg-green-600 hover:bg-green-700 gap-2">
                      Masuk Ujian <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Jadwal Mendatang</h2>
          </div>
          {upcomingExams.length === 0 ? (
            <div className="rounded-xl border bg-white p-4 text-center text-xs text-gray-400">Tidak ada jadwal mendatang</div>
          ) : (
            <div className="space-y-2">
              {upcomingExams.map((e) => {
                const typeInfo = getExamTypeInfo(e.examType);
                return (
                <div key={e.id} className="flex items-center justify-between rounded-xl border bg-white p-3 shadow-sm">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">{e.title}</p>
                      <Badge className={`text-xs hover:opacity-100 ${typeInfo.color}`}>{typeInfo.short}</Badge>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(e.startAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} ·
                      {new Date(e.startAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} ·
                      {e.durationMinutes} mnt
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">{e.subject.code}</Badge>
                </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="font-semibold text-gray-900">Riwayat Ujian</h2>
          </div>
          {history.length === 0 ? (
            <div className="rounded-xl border bg-white p-4 text-center text-xs text-gray-400">Belum ada ujian yang dikerjakan</div>
          ) : (
            <div className="space-y-2">
              {history.map((h) => {
                const passed = h.exam.passingScore !== null && (h.score ?? 0) >= h.exam.passingScore;
                return (
                  <div key={h.id} className="flex items-center justify-between rounded-xl border bg-white p-3 shadow-sm">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{h.exam.title}</p>
                      <p className="text-xs text-gray-400">
                        {h.exam.subject.code} ·
                        {h.submittedAt && ` ${new Date(h.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-lg font-bold ${passed ? "text-green-600" : "text-red-500"}`}>{h.score ?? "—"}</p>
                      {h.exam.passingScore !== null && <p className="text-xs text-gray-400">KKM: {h.exam.passingScore}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Link href="/student/results">
            <Button variant="ghost" size="sm" className="mt-2 w-full gap-1.5 text-gray-500">
              Lihat semua <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
