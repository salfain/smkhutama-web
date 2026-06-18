import { requirePiketAuth } from "@/lib/session";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Laporan Piket – SMK Hutama" };

export default async function LaporanPage() {
  await requirePiketAuth();
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Laporan</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Rekap dan ekspor data piket harian.</p>
      </div>
      <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
        <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-slate-600" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Ekspor Laporan</p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Fitur ekspor Excel akan tersedia di Tahap 2.</p>
      </div>
    </div>
  );
}
