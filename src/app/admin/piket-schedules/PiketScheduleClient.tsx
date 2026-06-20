"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, ToggleLeft, ToggleRight, CalendarCheck } from "lucide-react";
import { upsertPiketSchedule, deletePiketSchedule, togglePiketSchedule } from "./actions";
import { useConfirm } from "@/components/ConfirmDialog";

type Schedule = {
  id: string;
  dayOfWeek: number;
  isActive: boolean;
  note: string | null;
  teacher: { user: { name: string } };
};
type Teacher = { id: string; user: { name: string } };

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const DAY_COLORS: Record<number, string> = {
  1: "bg-blue-100 text-blue-700 border-blue-200",
  2: "bg-emerald-100 text-emerald-700 border-emerald-200",
  3: "bg-purple-100 text-purple-700 border-purple-200",
  4: "bg-orange-100 text-orange-700 border-orange-200",
  5: "bg-pink-100 text-pink-700 border-pink-200",
  6: "bg-amber-100 text-amber-700 border-amber-200",
  0: "bg-gray-100 text-gray-700 border-gray-200",
};

export function PiketScheduleClient({
  schedules, teachers,
}: { schedules: Schedule[]; teachers: Teacher[] }) {
  const [open, setOpen] = useState(false);
  const [teacherId, setTeacherId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function submit(fd: FormData) {
    setErr("");
    fd.set("teacherId", teacherId);
    fd.set("dayOfWeek", dayOfWeek);
    startTransition(async () => {
      const r = await upsertPiketSchedule(fd);
      if (r.error) setErr(r.error);
      else { setOpen(false); setTeacherId(""); setDayOfWeek(""); }
    });
  }

  async function handleDelete(id: string, name: string, day: string) {
    if (!(await confirm(`Hapus jadwal piket ${name} - ${day}?`))) return;
    startTransition(async () => { await deletePiketSchedule(id); });
  }

  function handleToggle(id: string) {
    startTransition(async () => { await togglePiketSchedule(id); });
  }

  // Kelompokkan per hari
  const byDay: Record<number, Schedule[]> = {};
  for (let d = 0; d <= 6; d++) byDay[d] = [];
  for (const s of schedules) byDay[s.dayOfWeek]?.push(s);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          size="sm"
          className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
          onClick={() => { setErr(""); setTeacherId(""); setDayOfWeek(""); setOpen(true); }}
        >
          <Plus className="h-4 w-4" />Tambah Jadwal
        </Button>
      </div>

      {/* Tampilkan per hari (Senin–Sabtu) */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((d) => (
          <div key={d} className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className={`px-4 py-3 border-b dark:border-slate-800 flex items-center gap-2 font-semibold text-sm ${DAY_COLORS[d]}`}>
              <CalendarCheck className="h-4 w-4" />
              {DAY_NAMES[d]}
              <span className="ml-auto text-xs font-normal">{byDay[d].length} guru</span>
            </div>
            <div className="p-3 space-y-2">
              {byDay[d].length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">Belum ada jadwal</p>
              ) : (
                byDay[d].map((s) => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                      s.isActive
                        ? "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800"
                        : "border-dashed border-gray-200 dark:border-slate-700 opacity-50"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-bold">
                      {s.teacher.user.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{s.teacher.user.name}</p>
                      {s.note && <p className="text-xs text-gray-400 truncate">{s.note}</p>}
                    </div>
                    <Badge className={`text-[10px] shrink-0 hover:opacity-100 ${s.isActive ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                      {s.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-amber-600"
                        title={s.isActive ? "Nonaktifkan" : "Aktifkan"}
                        onClick={() => handleToggle(s.id)}
                        disabled={pending}
                      >
                        {s.isActive
                          ? <ToggleRight className="h-4 w-4 text-green-500" />
                          : <ToggleLeft className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleDelete(s.id, s.teacher.user.name, DAY_NAMES[s.dayOfWeek])}
                        disabled={pending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dialog tambah jadwal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah Jadwal Piket</DialogTitle>
          </DialogHeader>
          <form action={submit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Guru *</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger><SelectValue placeholder="Pilih guru" /></SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Hari *</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger><SelectValue placeholder="Pilih hari" /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((d) => (
                    <SelectItem key={d} value={String(d)}>{DAY_NAMES[d]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">Catatan (opsional)</Label>
              <Input id="note" name="note" placeholder="Misal: Piket pagi, Shift 1" />
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white" disabled={pending}>
                Simpan Jadwal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
