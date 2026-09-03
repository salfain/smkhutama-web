import { Printer } from "lucide-react";
import { requireAuth } from "@/lib/session";
import { getExamsForPrint } from "./actions";
import { PrintClient } from "./PrintClient";

export const dynamic = "force-dynamic";

export default async function PrintPage() {
  await requireAuth("ADMIN_CBT");
  const exams = await getExamsForPrint().catch(() => []);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 print:hidden">
        <div className="flex items-center gap-2">
          <Printer className="h-6 w-6 text-brand-text" />
          <h1 className="font-heading text-2xl font-bold text-gray-900">Cetak Dokumen</h1>
        </div>
        <p className="text-sm text-gray-500">
          Cetak daftar hadir, berita acara, dan kartu peserta ujian
        </p>
      </div>

      <PrintClient
        exams={exams.map((e) => ({
          id: e.id,
          title: e.title,
          subject: { code: e.subject.code },
          examType: e.examType,
        }))}
      />
    </div>
  );
}
