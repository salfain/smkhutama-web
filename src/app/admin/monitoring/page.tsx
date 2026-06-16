import { MonitorCheck } from "lucide-react";
import { getActiveExams, getExamMonitoring } from "./actions";
import { MonitoringClient } from "./MonitoringClient";

export const dynamic = "force-dynamic";

export default async function MonitoringPage({
  searchParams,
}: { searchParams: Promise<{ examId?: string }> }) {
  const params = await searchParams;
  const examId = params.examId ?? null;

  const [exams, data] = await Promise.all([
    getActiveExams().catch(() => []),
    getExamMonitoring(examId).catch(() => null),
  ]);

  if (exams.length === 0 || !data) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-gray-900">Monitoring Ujian</h1>
          <p className="text-sm text-gray-500">Pantau peserta ujian secara real-time</p>
        </div>
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <MonitorCheck className="mx-auto mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">Belum ada ujian aktif</p>
          <p className="mt-1 text-xs text-gray-500">
            Aktifkan ujian di <a href="/admin/exams" className="underline text-blue-600">Jadwal Ujian</a> untuk mulai monitoring.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <MonitoringClient
        exam={data.exam}
        students={data.students}
        exams={exams.map((e) => ({ id: e.id, title: e.title, subject: e.subject }))}
      />
    </div>
  );
}
