import { getAgenda } from "../bk-actions";
import { CalendarDays, MessagesSquare, Inbox, Gavel } from "lucide-react";

export const dynamic = "force-dynamic";

const kindMeta: Record<string, { cls: string; icon: typeof MessagesSquare }> = {
  Konseling: { cls: "bg-purple-100 text-purple-700", icon: MessagesSquare },
  Permohonan: { cls: "bg-blue-100 text-blue-700", icon: Inbox },
  Pemanggilan: { cls: "bg-red-100 text-red-700", icon: Gavel },
};

export default async function AgendaPage() {
  const items = await getAgenda().catch(() => []);
  type AgendaItem = (typeof items)[number];

  // kelompokkan per tanggal
  const groups: Record<string, AgendaItem[]> = {};
  for (const it of items) {
    const key = new Date(it.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    (groups[key] ??= []).push(it);
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Agenda Konseling</h1>
        <p className="text-sm text-gray-500">Jadwal sesi konseling, permohonan, dan pemanggilan mendatang.</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <CalendarDays className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Tidak ada agenda mendatang.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([date, list]) => (
            <div key={date}>
              <div className="mb-2 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-purple-600" />
                <h2 className="text-sm font-semibold text-gray-800">{date}</h2>
              </div>
              <div className="space-y-2">
                {list.map((it) => {
                  const meta = kindMeta[it.kind] ?? kindMeta.Konseling;
                  const Icon = meta.icon;
                  return (
                    <div key={it.kind + it.id} className="flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50"><Icon className="h-4 w-4 text-gray-500" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{it.title}</p>
                        <p className="text-xs text-gray-500">{it.studentName} · {it.className}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.cls}`}>{it.kind}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
