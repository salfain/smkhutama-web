"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { savePiketSchedule, deletePiketSchedule } from "./actions";

const DAYS = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
  { value: 0, label: "Minggu" },
];

type Teacher = {
  id: string;
  nip: string | null;
  user: { name: string; username: string };
  subject: { code: string; name: string } | null;
};

type Schedule = {
  id: string;
  teacherId: string;
  dayOfWeek: number;
  isActive: boolean;
  note: string | null;
  teacher: Teacher;
};

export function PiketScheduleClient({
  teachers,
  schedules,
}: {
  teachers: Teacher[];
  schedules: Schedule[];
}) {
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? "");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [note, setNote] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const grouped = useMemo(() => {
    return DAYS.map((day) => ({
      ...day,
      schedules: schedules.filter((schedule) => schedule.dayOfWeek === day.value),
    }));
  }, [schedules]);

  function resetForm() {
    setTeacherId(teachers[0]?.id ?? "");
    setDayOfWeek("1");
    setNote("");
    setIsActive(true);
  }

  function editSchedule(schedule: Schedule) {
    setTeacherId(schedule.teacherId);
    setDayOfWeek(String(schedule.dayOfWeek));
    setNote(schedule.note ?? "");
    setIsActive(schedule.isActive);
    setMessage("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await savePiketSchedule(formData);
      if ("error" in result) setMessage(result.error ?? "Gagal menyimpan jadwal piket.");
      else {
        setMessage("Jadwal piket tersimpan.");
        resetForm();
      }
    });
  }

  function handleDelete(schedule: Schedule) {
    if (!confirm(`Hapus jadwal ${schedule.teacher.user.name} pada hari ${dayLabel(schedule.dayOfWeek)}?`)) return;
    setMessage("");
    startTransition(async () => {
      const result = await deletePiketSchedule(schedule.id);
      if ("error" in result) setMessage(result.error ?? "Gagal menghapus jadwal piket.");
      else setMessage("Jadwal piket dihapus.");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={handleSubmit} className="h-fit rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Atur Jadwal</h2>
            <p className="text-xs text-gray-500">Satu guru bisa dijadwalkan di beberapa hari.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="teacherId">Guru</Label>
            <select
              id="teacherId"
              name="teacherId"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              required
            >
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user.name} ({teacher.user.username})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dayOfWeek">Hari Piket</Label>
            <select
              id="dayOfWeek"
              name="dayOfWeek"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              required
            >
              {DAYS.map((day) => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Catatan</Label>
            <Input
              id="note"
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Opsional, mis. shift pagi"
            />
          </div>

          <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Jadwal aktif
          </label>

          {message && (
            <p className={`rounded-lg px-3 py-2 text-sm ${
              message.includes("tersimpan") || message.includes("dihapus")
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}>
              {message}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600" disabled={pending || teachers.length === 0}>
              {pending ? "Menyimpan..." : "Simpan Jadwal"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm} disabled={pending}>
              Reset
            </Button>
          </div>
        </div>
      </form>

      <div className="space-y-4">
        {grouped.map((day) => (
          <section key={day.value} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-amber-600" />
              <h3 className="font-semibold text-gray-900">{day.label}</h3>
              <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                {day.schedules.length} guru
              </span>
            </div>

            {day.schedules.length === 0 ? (
              <p className="rounded-lg border border-dashed px-3 py-4 text-sm text-gray-400">
                Belum ada guru piket.
              </p>
            ) : (
              <div className="divide-y rounded-lg border">
                {day.schedules.map((schedule) => (
                  <div key={schedule.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{schedule.teacher.user.name}</p>
                      <p className="text-xs text-gray-500">
                        {schedule.teacher.subject
                          ? `${schedule.teacher.subject.code} - ${schedule.teacher.subject.name}`
                          : schedule.teacher.user.username}
                      </p>
                      {schedule.note && <p className="mt-1 text-xs text-amber-700">{schedule.note}</p>}
                    </div>
                    <span className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${
                      schedule.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {schedule.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => editSchedule(schedule)}>
                        <Pencil className="mr-1 h-3.5 w-3.5" />Edit
                      </Button>
                      <Button type="button" size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(schedule)}>
                        <Trash2 className="mr-1 h-3.5 w-3.5" />Hapus
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

function dayLabel(dayOfWeek: number) {
  return DAYS.find((day) => day.value === dayOfWeek)?.label ?? "Tidak valid";
}
