import { getReportSummary } from "./actions";
import { ReportsClient } from "./ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const data = await getReportSummary().catch(() => null);

  if (!data) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <p className="text-sm text-red-600">Gagal mengambil data laporan dari database.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Laporan & Export</h1>
        <p className="text-sm text-gray-500">Generate dan unduh laporan sistem CBT</p>
      </div>
      <ReportsClient stats={data} recentClosed={data.recentClosed} />
    </div>
  );
}
