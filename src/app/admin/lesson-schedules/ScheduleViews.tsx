"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Pencil,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { timeRangesOverlap } from "@/lib/lesson-schedule";
import { cn } from "@/lib/utils";
import { ClassOption, DAY_NAMES, Schedule, shortTeacherName } from "./types";

type ScheduleActions = {
  onCreate: (day?: number, classId?: string) => void;
  onEdit: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
  disabled?: boolean;
};

export function ClassScheduleView({
  schedules,
  selectedClass,
  actions,
}: {
  schedules: Schedule[];
  selectedClass?: ClassOption;
  actions: ScheduleActions;
}) {
  const byDay = useMemo(() => groupByDay(schedules), [schedules]);

  if (!selectedClass) {
    return <EmptyState title="Belum ada kelas" description="Tambahkan data kelas terlebih dahulu sebelum menyusun jadwal." />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((day) => (
        <section
          key={day}
          className="overflow-hidden rounded-xl border border-[#E8E8EC] bg-white transition-shadow hover:shadow-[0_10px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#19191C]"
        >
          <div className="flex items-center border-b border-[#E8E8EC] px-4 py-3.5 dark:border-white/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-text dark:bg-brand/10 dark:text-brand-text">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="ml-3">
              <h2 className="font-heading text-sm font-semibold text-gray-900 dark:text-white">{DAY_NAMES[day]}</h2>
              <p className="text-[11px] text-gray-400">{byDay[day].length} mata pelajaran</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8 text-gray-400 hover:bg-brand-soft hover:text-brand-text dark:hover:bg-brand/10"
              onClick={() => actions.onCreate(day, selectedClass.id)}
              disabled={actions.disabled}
              title={`Tambah jadwal ${DAY_NAMES[day]}`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="min-h-36 divide-y divide-[#E8E8EC] dark:divide-white/10">
            {byDay[day].length === 0 ? (
              <button
                type="button"
                className="flex min-h-36 w-full flex-col items-center justify-center gap-2 px-4 text-xs text-gray-400 transition-colors hover:bg-gray-50 hover:text-brand-text disabled:pointer-events-none dark:hover:bg-white/[0.03]"
                onClick={() => actions.onCreate(day, selectedClass.id)}
                disabled={actions.disabled}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-current">
                  <Plus className="h-4 w-4" />
                </span>
                Belum ada jadwal
              </button>
            ) : (
              byDay[day].map((schedule) => (
                <article key={schedule.id} className="group relative px-4 py-4 transition-colors hover:bg-[#FAFAFA] dark:hover:bg-white/[0.03]">
                  <div className="flex items-start gap-3">
                    <div className="w-[70px] shrink-0 rounded-lg bg-[#F7F7F9] px-2 py-2 text-center dark:bg-white/[0.05]">
                      <p className="font-mono text-xs font-semibold text-brand-text dark:text-brand-text">{schedule.startTime}</p>
                      <div className="mx-auto my-1 h-px w-4 bg-gray-300 dark:bg-gray-600" />
                      <p className="font-mono text-[10px] text-gray-500 dark:text-gray-400">{schedule.endTime}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="inline-flex rounded bg-brand-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold text-brand-text dark:bg-brand/10 dark:text-brand-text">
                            {schedule.subject.code}
                          </span>
                          <h3 className="mt-1.5 truncate text-sm font-semibold text-gray-900 dark:text-white">{schedule.subject.name}</h3>
                        </div>
                        <div className="flex shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-brand-text" onClick={() => actions.onEdit(schedule)} title="Edit jadwal">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:bg-red-50 hover:text-red-600" onClick={() => actions.onDelete(schedule)} title="Hapus jadwal">
                            <span className="text-lg leading-none">×</span>
                          </Button>
                        </div>
                      </div>
                      <p className="mt-2 flex items-center gap-1.5 truncate text-xs text-gray-500 dark:text-gray-400">
                        <UserRound className="h-3.5 w-3.5 shrink-0 text-gray-400" /> {schedule.teacher.user.name}
                      </p>
                      {schedule.room && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                          <MapPin className="h-3.5 w-3.5" /> {schedule.room}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

export function AllClassesScheduleView({
  schedules,
  classes,
  selectedDay,
  onDayChange,
  gradeFilter,
  onGradeChange,
  query,
  onQueryChange,
  actions,
}: {
  schedules: Schedule[];
  classes: ClassOption[];
  selectedDay: number;
  onDayChange: (day: number) => void;
  gradeFilter: string;
  onGradeChange: (grade: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
  actions: ScheduleActions;
}) {
  const grades = useMemo(() => Array.from(new Set(classes.map((item) => item.grade))).sort(), [classes]);
  const visibleClasses = useMemo(() => filterScheduleClasses(classes, schedules, gradeFilter, query), [classes, schedules, gradeFilter, query]);
  const daySchedules = useMemo(
    () => schedules.filter((schedule) => schedule.dayOfWeek === selectedDay && visibleClasses.some((item) => item.id === schedule.classId)),
    [schedules, selectedDay, visibleClasses],
  );
  const slots = useMemo(() => getTimeSlots(daySchedules), [daySchedules]);
  const conflictIds = useMemo(() => findConflictIds(daySchedules), [daySchedules]);
  const scheduledClassCount = new Set(daySchedules.map((schedule) => schedule.classId)).size;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#E8E8EC] bg-white p-4 dark:border-white/10 dark:bg-[#19191C]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-gray-400">Pilih hari</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => onDayChange(day)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                    selectedDay === day
                      ? "border-brand bg-brand text-white shadow-[0_5px_15px_rgba(99,102,241,0.18)]"
                      : "border-[#E8E8EC] bg-white text-gray-600 hover:border-brand-soft hover:text-brand-text dark:border-white/10 dark:bg-transparent dark:text-gray-300",
                  )}
                >
                  {DAY_NAMES[day]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[180px_minmax(240px,1fr)] xl:w-[480px]">
            <div>
              <label htmlFor="grade-filter" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-gray-400">Tingkat</label>
              <select
                id="grade-filter"
                value={gradeFilter}
                onChange={(event) => onGradeChange(event.target.value)}
                className="h-10 w-full rounded-md border border-[#E8E8EC] bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand dark:border-white/10 dark:bg-[#202024] dark:text-gray-200"
              >
                <option value="all">Semua tingkat</option>
                {grades.map((grade) => <option key={grade} value={grade}>Kelas {grade}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="schedule-search" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-gray-400">Pencarian</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="schedule-search"
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  className="pl-9"
                  placeholder="Kelas, mapel, atau guru..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={CalendarDays} label="Kelas terjadwal" value={`${scheduledClassCount}/${visibleClasses.length}`} tone="indigo" />
        <SummaryCard icon={BookOpen} label={`Jadwal ${DAY_NAMES[selectedDay]}`} value={String(daySchedules.length)} tone="blue" />
        <SummaryCard
          icon={conflictIds.size > 0 ? AlertTriangle : CheckCircle2}
          label="Status jadwal"
          value={conflictIds.size > 0 ? `${conflictIds.size} bentrok` : "Tanpa bentrok"}
          tone={conflictIds.size > 0 ? "red" : "green"}
        />
      </div>

      {visibleClasses.length === 0 ? (
        <EmptyState title="Kelas tidak ditemukan" description="Coba ubah tingkat atau kata kunci pencarian." />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-[#E8E8EC] bg-white dark:border-white/10 dark:bg-[#19191C] md:block">
            <div className="overflow-auto">
              <table className="w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr>
                    <th className="sticky left-0 top-0 z-30 min-w-[112px] border-b border-r border-[#E8E8EC] bg-[#F7F7F9] px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-gray-500 dark:border-white/10 dark:bg-[#222226] dark:text-gray-400">
                      Jam
                    </th>
                    {visibleClasses.map((item) => (
                      <th key={item.id} className="sticky top-0 z-20 min-w-[176px] border-b border-r border-[#E8E8EC] bg-[#F7F7F9] px-4 py-3 last:border-r-0 dark:border-white/10 dark:bg-[#222226]">
                        <p className="font-heading text-sm font-semibold text-gray-900 dark:text-white">{item.name}</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-400">{item.major.code} · Tingkat {item.grade}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {slots.length === 0 ? (
                    <tr>
                      <td colSpan={visibleClasses.length + 1} className="px-6 py-16 text-center text-sm text-gray-400">Belum ada jadwal pada hari {DAY_NAMES[selectedDay]}.</td>
                    </tr>
                  ) : (
                    slots.map((slot) => (
                      <tr key={slot.key}>
                        <th className="sticky left-0 z-10 border-b border-r border-[#E8E8EC] bg-white px-4 py-4 align-top dark:border-white/10 dark:bg-[#19191C]">
                          <p className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">{slot.startTime}</p>
                          <p className="mt-1 font-mono text-[10px] text-gray-400">{slot.endTime}</p>
                        </th>
                        {visibleClasses.map((item) => {
                          const schedule = daySchedules.find((entry) => entry.classId === item.id && entry.startTime === slot.startTime && entry.endTime === slot.endTime);
                          return (
                            <td key={item.id} className="h-[108px] border-b border-r border-[#E8E8EC] p-2 align-top last:border-r-0 dark:border-white/10">
                              {schedule ? (
                                <button
                                  type="button"
                                  onClick={() => actions.onEdit(schedule)}
                                  className={cn(
                                    "h-full w-full rounded-lg border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
                                    conflictIds.has(schedule.id)
                                      ? "border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
                                      : "border-brand-soft bg-brand-soft text-gray-900 hover:border-brand-soft dark:border-brand/20 dark:bg-brand/[0.08] dark:text-white",
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-brand-text dark:text-brand-text">{schedule.subject.code}</span>
                                    {conflictIds.has(schedule.id) && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                                  </div>
                                  <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed">{schedule.subject.name}</p>
                                  <p className="mt-2 truncate text-[10px] text-gray-500 dark:text-gray-400">{shortTeacherName(schedule.teacher.user.name)}</p>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => actions.onCreate(selectedDay, item.id)}
                                  disabled={actions.disabled}
                                  className="group flex h-full min-h-[88px] w-full items-center justify-center rounded-lg border border-dashed border-transparent text-gray-300 transition-colors hover:border-brand-soft hover:bg-brand-soft hover:text-brand-text disabled:pointer-events-none dark:hover:border-brand/30 dark:hover:bg-brand-strong/[0.05]"
                                  title={`Tambah jadwal ${item.name}`}
                                >
                                  <Plus className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {visibleClasses.map((item) => {
              const classSchedules = daySchedules.filter((schedule) => schedule.classId === item.id);
              return (
                <section key={item.id} className="overflow-hidden rounded-xl border border-[#E8E8EC] bg-white dark:border-white/10 dark:bg-[#19191C]">
                  <div className="flex items-center border-b border-[#E8E8EC] px-4 py-3 dark:border-white/10">
                    <div>
                      <h3 className="font-heading text-sm font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                      <p className="text-[11px] text-gray-400">{item.major.code} · {classSchedules.length} mata pelajaran</p>
                    </div>
                    <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 text-brand-text" onClick={() => actions.onCreate(selectedDay, item.id)} disabled={actions.disabled}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="divide-y divide-[#E8E8EC] dark:divide-white/10">
                    {classSchedules.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs text-gray-400">Belum ada jadwal</p>
                    ) : classSchedules.map((schedule) => (
                      <button key={schedule.id} type="button" onClick={() => actions.onEdit(schedule)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                        <div className="w-[82px] shrink-0 font-mono text-[11px] font-semibold text-brand-text dark:text-brand-text">{schedule.startTime}–{schedule.endTime}</div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{schedule.subject.name}</p>
                          <p className="truncate text-[11px] text-gray-400">{schedule.teacher.user.name}</p>
                        </div>
                        <Pencil className="h-3.5 w-3.5 text-gray-300" />
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function PrintableAllClassesSchedule({
  schedules,
  classes,
  academicYearLabel,
}: {
  schedules: Schedule[];
  classes: ClassOption[];
  academicYearLabel: string;
}) {
  const grades = Array.from(new Set(classes.map((item) => item.grade))).sort();

  return (
    <div className="lesson-schedule-print print-doc hidden print:block">
      {[1, 2, 3, 4, 5, 6].flatMap((day) => grades.map((grade) => {
        const gradeClasses = classes.filter((item) => item.grade === grade);
        const daySchedules = schedules.filter((schedule) => schedule.dayOfWeek === day && gradeClasses.some((item) => item.id === schedule.classId));
        const slots = getTimeSlots(daySchedules);
        return (
          <section key={`${day}-${grade}`} className="lesson-schedule-print-page">
            <div className="mb-4 border-b-2 border-black pb-3 text-center">
              <p className="text-[9px] font-semibold uppercase tracking-[0.24em]">SMK HUTAMA</p>
              <h1 className="mt-1 text-lg font-bold uppercase">Jadwal Kegiatan Belajar Mengajar</h1>
              <p className="mt-1 text-[10px]">{academicYearLabel} · {DAY_NAMES[day]} · Tingkat {grade}</p>
            </div>
            <table className="w-full table-fixed border-collapse text-[8px]">
              <thead>
                <tr>
                  <th className="w-[64px] border border-black bg-gray-100 px-1.5 py-2">JAM</th>
                  {gradeClasses.map((item) => <th key={item.id} className="border border-black bg-gray-100 px-1.5 py-2">{item.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {slots.length === 0 ? (
                  <tr><td colSpan={gradeClasses.length + 1} className="border border-black py-8 text-center">Belum ada jadwal</td></tr>
                ) : slots.map((slot, index) => (
                  <tr key={slot.key}>
                    <td className="border border-black px-1 py-2 text-center font-semibold">{index + 1}<br />{slot.startTime}–{slot.endTime}</td>
                    {gradeClasses.map((item) => {
                      const schedule = daySchedules.find((entry) => entry.classId === item.id && entry.startTime === slot.startTime && entry.endTime === slot.endTime);
                      return (
                        <td key={item.id} className="h-[42px] border border-black px-1.5 py-1 text-center align-middle">
                          {schedule && <><strong>{schedule.subject.code}</strong><br /><span>{shortTeacherName(schedule.teacher.user.name)}</span>{schedule.room && <><br /><span>{schedule.room}</span></>}</>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex justify-between text-[8px]">
              <span>Dicetak dari Sistem Informasi SMK Hutama</span>
              <span>{DAY_NAMES[day]} · Tingkat {grade}</span>
            </div>
          </section>
        );
      }))}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, tone }: { icon: typeof CalendarDays; label: string; value: string; tone: "indigo" | "blue" | "green" | "red" }) {
  const tones = {
    indigo: "bg-brand-soft text-brand-text dark:bg-brand/10 dark:text-brand-text",
    blue: "bg-brand-soft text-brand-text dark:bg-brand/10 dark:text-brand-text",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    red: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#E8E8EC] bg-white p-4 dark:border-white/10 dark:bg-[#19191C]">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", tones[tone])}><Icon className="h-5 w-5" /></div>
      <div><p className="text-xs text-gray-400">{label}</p><p className="mt-0.5 font-heading text-base font-semibold text-gray-900 dark:text-white">{value}</p></div>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#DADAE0] bg-white px-6 py-16 text-center dark:border-white/10 dark:bg-[#19191C]">
      <Clock3 className="mx-auto h-7 w-7 text-gray-300 dark:text-gray-600" />
      <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</p>
      <p className="mt-1 text-xs text-gray-400">{description}</p>
    </div>
  );
}

function groupByDay(schedules: Schedule[]) {
  const grouped: Record<number, Schedule[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const schedule of schedules) grouped[schedule.dayOfWeek]?.push(schedule);
  for (const day of Object.keys(grouped)) grouped[Number(day)].sort((a, b) => a.startTime.localeCompare(b.startTime));
  return grouped;
}

export function getTimeSlots(schedules: Schedule[]) {
  const slots = new Map<string, { key: string; startTime: string; endTime: string }>();
  for (const schedule of schedules) {
    const key = `${schedule.startTime}-${schedule.endTime}`;
    slots.set(key, { key, startTime: schedule.startTime, endTime: schedule.endTime });
  }
  return Array.from(slots.values()).sort((a, b) => a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime));
}

export function filterScheduleClasses(classes: ClassOption[], schedules: Schedule[], grade: string, query: string) {
  const normalized = query.trim().toLowerCase();
  return classes.filter((item) => {
    if (grade !== "all" && item.grade !== grade) return false;
    if (!normalized) return true;
    const classMatches = `${item.name} ${item.grade} ${item.major.code}`.toLowerCase().includes(normalized);
    const scheduleMatches = schedules.some((schedule) => schedule.classId === item.id && `${schedule.subject.name} ${schedule.subject.code} ${schedule.teacher.user.name}`.toLowerCase().includes(normalized));
    return classMatches || scheduleMatches;
  });
}

function findConflictIds(schedules: Schedule[]) {
  const ids = new Set<string>();
  for (let firstIndex = 0; firstIndex < schedules.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < schedules.length; secondIndex += 1) {
      const first = schedules[firstIndex];
      const second = schedules[secondIndex];
      if (
        (first.classId === second.classId || first.teacherId === second.teacherId)
        && timeRangesOverlap(first.startTime, first.endTime, second.startTime, second.endTime)
      ) {
        ids.add(first.id);
        ids.add(second.id);
      }
    }
  }
  return ids;
}
