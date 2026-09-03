import { BarChart3 } from "lucide-react";
import { requirePiketAuth } from "@/lib/session";
import { getLaporanData } from "./actions";
import { LaporanClient } from "./LaporanClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Laporan Piket – SMK Hutama" };

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await requirePiketAuth();
  const { date } = await searchParams;
  const data = await getLaporanData(date);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
          <BarChart3 className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Laporan Piket</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Rekap harian keterlambatan, izin keluar, dan kehadiran guru. Export ke Excel tersedia.
          </p>
        </div>
      </div>
      <LaporanClient
        summary={data.summary}
        tardiness={data.tardiness}
        permits={data.permits}
        teacherAttendances={data.teacherAttendances}
        trend={data.trend}
        dateLabel={data.dateLabel}
        currentDate={date}
      />
    </div>
  );
}
