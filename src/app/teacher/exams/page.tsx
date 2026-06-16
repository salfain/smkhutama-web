import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList } from "lucide-react";
import { getMyExams } from "./actions";
import { ExamsList } from "./ExamsList";

export const dynamic = "force-dynamic";

export default async function TeacherExamsPage() {
  const exams = await getMyExams().catch(() => []);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Paket Ujian</h1>
          <p className="text-sm text-gray-500">{exams.length} ujian dibuat</p>
        </div>
        <Link href="/teacher/exams/create">
          <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" />Buat Paket Ujian
          </Button>
        </Link>
      </div>

      {exams.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <ClipboardList className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada paket ujian. Buat ujian pertama Anda.</p>
        </div>
      ) : (
        <ExamsList exams={exams.map((e) => ({
          id: e.id, title: e.title, status: e.status, examType: e.examType,
          startAt: e.startAt, endAt: e.endAt, durationMinutes: e.durationMinutes,
          subject: { code: e.subject.code },
          classes: e.classes.map((c) => ({ name: c.class.name })),
          _count: e._count,
        }))} />
      )}
    </div>
  );
}
