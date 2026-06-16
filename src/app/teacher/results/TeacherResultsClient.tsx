"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Eye } from "lucide-react";
import { AnswerReviewDialog } from "@/components/AnswerReviewDialog";

type Attempt = {
  id: string;
  score: number | null;
  status: string;
  student: { name: string; class: string };
};

type Exam = {
  id: string;
  title: string;
  status: string;
  passingScore: number | null;
  subject: { code: string };
  attempts: Attempt[];
};

export function TeacherResultsClient({ exams }: { exams: Exam[] }) {
  const [reviewAttemptId, setReviewAttemptId] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  function openReview(attemptId: string) {
    setReviewAttemptId(attemptId);
    setReviewOpen(true);
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Hasil Nilai</h1>
        <p className="text-sm text-gray-500">Rekap nilai siswa · Klik nama untuk lihat jawaban detail</p>
      </div>

      {exams.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <ClipboardList className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada hasil ujian</p>
        </div>
      ) : (
        <div className="space-y-6">
          {exams.map((exam) => {
            const scores = exam.attempts.map((a) => a.score ?? 0);
            const avg = scores.length > 0 ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : 0;

            return (
              <Card key={exam.id} className="border shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">{exam.title}</p>
                      <p className="text-xs text-gray-400">{exam.subject.code} · {exam.attempts.length} peserta · Rata-rata: {avg}</p>
                    </div>
                    <Badge className={exam.status === "ACTIVE"
                      ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                      : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100"}>
                      {exam.status === "ACTIVE" ? "Aktif" : "Selesai"}
                    </Badge>
                  </div>

                  {exam.attempts.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Belum ada yang submit</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-xs text-gray-500">
                            <th className="text-left py-2 font-medium">No</th>
                            <th className="text-left py-2 font-medium">Nama</th>
                            <th className="text-left py-2 font-medium">Kelas</th>
                            <th className="text-center py-2 font-medium">Nilai</th>
                            {exam.passingScore !== null && <th className="text-center py-2 font-medium">Status</th>}
                            <th className="text-center py-2 font-medium">Detail</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {exam.attempts.map((a, i) => {
                            const lulus = exam.passingScore !== null && (a.score ?? 0) >= exam.passingScore;
                            return (
                              <tr key={a.id} className="hover:bg-gray-50">
                                <td className="py-2 text-gray-500">{i + 1}</td>
                                <td className="py-2 font-medium text-gray-800">{a.student.name}</td>
                                <td className="py-2 text-gray-600">{a.student.class}</td>
                                <td className={`py-2 text-center font-bold ${(a.score ?? 0) >= 75 ? "text-green-600" : "text-red-500"}`}>
                                  {a.score ?? <span className="text-yellow-500">Belum dinilai</span>}
                                </td>
                                {exam.passingScore !== null && (
                                  <td className="py-2 text-center">
                                    {a.score !== null ? (
                                      <Badge className={lulus
                                        ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                                        : "bg-red-100 text-red-600 border-red-200 hover:bg-red-100"}>
                                        {lulus ? "Lulus" : "Tidak Lulus"}
                                      </Badge>
                                    ) : <span className="text-xs text-gray-400">—</span>}
                                  </td>
                                )}
                                <td className="py-2 text-center">
                                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-blue-600 hover:bg-blue-50 h-7"
                                    onClick={() => openReview(a.id)}>
                                    <Eye className="h-3 w-3" />Jawaban
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AnswerReviewDialog
        open={reviewOpen}
        onClose={() => { setReviewOpen(false); setReviewAttemptId(null); }}
        attemptId={reviewAttemptId}
        showCorrectAnswers={true}
      />
    </div>
  );
}
