import { getStats } from "../content-actions";
import { StatsClient } from "./StatsClient";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const stats = await getStats().catch(() => []);
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Statistik</h1>
        <p className="text-sm text-gray-500">Angka highlight di beranda (akreditasi, jumlah siswa, dll)</p>
      </div>
      <StatsClient stats={stats.map((s) => ({ id: s.id, label: s.label, value: s.value }))} />
    </div>
  );
}
