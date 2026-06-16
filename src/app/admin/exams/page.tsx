import { getExams, getExamFormData } from "./actions";
import { ExamTable } from "./ExamTable";

export const dynamic = "force-dynamic";

export default async function AdminExamsPage() {
  const [exams, opts] = await Promise.all([
    getExams().catch(() => []),
    getExamFormData().catch(() => ({ subjects: [], teachers: [], classes: [], academicYears: [] })),
  ]);

  const active = exams.filter((e) => e.status === "ACTIVE").length;
  const draft = exams.filter((e) => e.status === "DRAFT").length;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Jadwal Ujian</h1>
        <p className="text-sm text-gray-500">
          {exams.length} ujian · {active} aktif · {draft} draft
        </p>
      </div>
      <ExamTable exams={exams} opts={opts} />
    </div>
  );
}
