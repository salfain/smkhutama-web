import { getReportData } from "../reports-actions";
import { ReportsClient } from "./ReportsClient";

export const dynamic = "force-dynamic";

export default async function CounselorReportsPage() {
  const data = await getReportData().catch(() => null);
  if (!data) return <div className="p-8 text-sm text-gray-500">Gagal memuat data.</div>;
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Laporan & Rekap BK</h1>
        <p className="text-sm text-gray-500">Rekap pelanggaran, prestasi, dan konseling. Bisa diekspor ke Excel.</p>
      </div>
      <ReportsClient data={data} />
    </div>
  );
}
