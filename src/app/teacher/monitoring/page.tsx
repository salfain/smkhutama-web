import Link from "next/link";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MonitorCheck, Clock, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherMonitoringPage() {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return null;

  const exams = await prisma.exam.findMany({
    where: { teacherId: user.teacher.id, status: "ACTIVE" },
    orderBy: { startAt: "desc" },
    include: {
      subject: { select: { code: true } },
      _count: { select: { questions: true, attempts: true } },
      attempts: {
        include: {
          student: {
            include: {
              user: { select: { name: true } },
              class: { select: { name: true } },
            },
          },
          _count: { select: { answers: true } },
        },
      },
    },
  });

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Monitoring Ujian</h1>
        <p className="text-sm text-gray-500">Pantau peserta yang sedang mengerjakan ujian Anda</p>
      </div>

      {exams.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <MonitorCheck className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Tidak ada ujian aktif saat ini</p>
          <Link href="/teacher/exams" className="mt-2 inline-block text-xs text-emerald-600 underline">
            Lihat paket ujian
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {exams.map((exam) => {
            const totalQ = exam._count.questions;
            return (
              <div key={exam.id} className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-semibold text-gray-900">{exam.title}</p>
                    <p className="text-xs text-gray-400">{exam.subject.code} · {totalQ} soal · {exam._count.attempts} peserta</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">● Aktif</Badge>
                </div>

                {exam.attempts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Belum ada siswa yang mengerjakan</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {exam.attempts.map((a) => {
                      const answered = a._count.answers;
                      const progress = totalQ > 0 ? (answered / totalQ) * 100 : 0;
                      const isInProgress = a.status === "IN_PROGRESS";
                      const isSubmitted = a.status === "SUBMITTED" || a.status === "AUTO_SUBMITTED";
                      return (
                        <div key={a.id} className="rounded-lg border p-3">
                          <div className="mb-2 flex items-start justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{a.student.user.name}</p>
                              <p className="text-xs text-gray-400">{a.student.class?.name ?? "—"}</p>
                            </div>
                            <Badge className={`text-xs hover:opacity-100 shrink-0 ${
                              isInProgress ? "bg-green-100 text-green-700 border-green-200"
                              : isSubmitted ? "bg-blue-100 text-blue-700 border-blue-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                            }`}>
                              {isInProgress ? <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Mengerjakan</span>
                              : isSubmitted ? "Selesai" : "Belum Mulai"}
                            </Badge>
                          </div>
                          <div>
                            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                              <span>Progress</span>
                              <span className="font-medium">{answered}/{totalQ}</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                          {isSubmitted && a.score !== null && (
                            <p className="mt-2 text-sm font-bold text-purple-600">Nilai: {a.score}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
