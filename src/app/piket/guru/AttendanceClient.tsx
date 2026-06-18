"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Users } from "lucide-react";
import { createAttendance, deleteAttendance } from "../actions";
import { useConfirm } from "@/components/ConfirmDialog";

type Teacher = { id: string; name: string };
type ClassItem = { id: string; name: string };
type AttRecord = {
  id: string; teacherName: string; className: string; status: string;
  period: string | null; substitute: string | null; note: string | null; createdAt: Date;
};

const statusStyle: Record<string, string> = {
  HADIR: "bg-green-100 text-green-700 border-green-200",
  TIDAK_HADIR: "bg-red-100 text-red-700 border-red-200",
  DIGANTIKAN: "bg-yellow-100 text-yellow-700 border-yellow-200",
  TUGAS_LUAR: "bg-blue-100 text-blue-700 border-blue-200",
};
const statusLabel: Record<string, string> = {
  HADIR: "Hadir", TIDAK_HADIR: "Tidak Hadir", DIGANTIKAN: "Digantikan", TUGAS_LUAR: "Tugas Luar",
};

export function AttendanceClient({
  records, teachers, classes,
}: { records: AttRecord[]; teachers: Teacher[]; classes: ClassItem[] }) {
  const [open, setOpen] = useState(false);
  const [teacherId, setTeacherId] = useState("");
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState("HADIR");
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function submit(fd: FormData) {
    setErr("");
    fd.set("teacherId", teacherId);
    fd.set("classId", classId);
    fd.set("status", status);
    startTransition(async () => {
      const r = await createAttendance(fd);
      if (r.error) setErr(r.error); else { setOpen(false); setTeacherId(""); setClassId(""); setStatus("HADIR"); }
    });
  }

  async function remove(id: string) {
    if (!(await confirm("Hapus catatan kehadiran ini?"))) return;
    startTransition(async () => { await deleteAttendance(id); });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" className="gap-1.5 bg-amber-500 hover:bg-amber-600" onClick={() => { setErr(""); setOpen(true); }}>
          <Plus className="h-4 w-4" />Catat Kehadiran
        </Button>
      </div>

      {records.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
          <Users className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-slate-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada catatan kehadiran guru hari ini.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-950 text-left text-xs text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Guru</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">Jam</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Pengganti</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.teacherName}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.className}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.period ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs hover:opacity-100 ${statusStyle[r.status] ?? ""}`}>
                      {statusLabel[r.status] ?? r.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.substitute ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => remove(r.id)} disabled={pending}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Catat Kehadiran Guru</DialogTitle></DialogHeader>
          <form action={submit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Guru *</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger><SelectValue placeholder="Pilih guru" /></SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Kelas *</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status *</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HADIR">Hadir</SelectItem>
                    <SelectItem value="TIDAK_HADIR">Tidak Hadir</SelectItem>
                    <SelectItem value="DIGANTIKAN">Digantikan</SelectItem>
                    <SelectItem value="TUGAS_LUAR">Tugas Luar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="period">Jam Ke-</Label>
                <Input id="period" name="period" placeholder="mis. Jam 1-2" />
              </div>
            </div>
            {status === "DIGANTIKAN" && (
              <div className="space-y-1.5">
                <Label htmlFor="substitute">Nama Pengganti</Label>
                <Input id="substitute" name="substitute" placeholder="Nama guru pengganti" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="note">Catatan (opsional)</Label>
              <Input id="note" name="note" placeholder="Catatan tambahan" />
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600" disabled={pending}>Simpan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
