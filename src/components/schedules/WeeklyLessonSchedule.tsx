import { BookOpen, CalendarDays, Clock, MapPin, UserRound } from "lucide-react";

export type WeeklyScheduleItem = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectName: string;
  subjectCode: string;
  context: string;
  room: string | null;
  note: string | null;
};

const DAY_NAMES = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function WeeklyLessonSchedule({ items, emptyText }: { items: WeeklyScheduleItem[]; emptyText: string }) {
  const grouped: Record<number, WeeklyScheduleItem[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const item of items) grouped[item.dayOfWeek]?.push(item);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E8E8EC] bg-white px-5 py-14 text-center dark:border-white/10 dark:bg-[#19191C]">
        <BookOpen className="mx-auto mb-3 h-7 w-7 text-gray-300 dark:text-gray-600" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Belum ada jadwal mata pelajaran</p>
        <p className="mt-1 text-xs text-gray-400">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((day) => (
        <section key={day} className="overflow-hidden rounded-xl border border-[#E8E8EC] bg-white dark:border-white/10 dark:bg-[#19191C]">
          <div className="flex items-center gap-2 border-b border-[#E8E8EC] px-4 py-3.5 dark:border-white/10">
            <CalendarDays className="h-4 w-4 text-brand-text" />
            <h2 className="font-heading text-sm font-semibold text-gray-900 dark:text-white">{DAY_NAMES[day]}</h2>
            <span className="ml-auto text-xs text-gray-400">{grouped[day].length} pelajaran</span>
          </div>
          <div className="min-h-28 divide-y divide-[#E8E8EC] dark:divide-white/10">
            {grouped[day].length === 0 ? (
              <p className="flex min-h-28 items-center justify-center px-4 text-xs text-gray-400">Tidak ada jadwal</p>
            ) : grouped[day].map((item) => (
              <article key={item.id} className="px-4 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                <p className="flex items-center gap-2 font-mono text-xs font-semibold text-brand-text"><Clock className="h-3.5 w-3.5" /> {item.startTime}–{item.endTime}</p>
                <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{item.subjectName}</h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.subjectCode}</p>
                <div className="mt-3 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <p className="flex items-center gap-2"><UserRound className="h-3.5 w-3.5 text-gray-400" /> {item.context}</p>
                  {item.room && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-gray-400" /> {item.room}</p>}
                  {item.note && <p className="text-[11px] text-gray-400">{item.note}</p>}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
