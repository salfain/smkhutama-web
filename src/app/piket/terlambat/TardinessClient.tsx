"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Clock } from "lucide-react";
import { createTardiness, deleteTardiness } from "../actions";
import { useConfirm } from "@/components/ConfirmDialog";

type Student = { id: string; name: string; className: string; nis: string | null };
type Record = {
  id: string; studentName: string; className: string;
  arrivalTime: Date; reason: string | null; sanction: string | null; createdAt: Date;
};

export function TardinessClient({ records, students }: { records: Record[]; students: Student[] }) {
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function submit(fd: FormData) {
    setErr("");
    fd.set("studentId", studentId);
    startTransition(async () => {
      const r = await createTardiness(fd);
      if (r.error) setErr(r.error); else { setOpen(false); setStudentId(""); }
    });
  }

  async function remove(id: string) {
    if (!(await confirm("Hapus catatan keterlambatan ini?"))) return;
    startTransition(async () => { await deleteTardiness(id); });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" className="gap-1.5 bg-amber-500 hover:bg-amber-600" onClick={() => { setStudentId(""); setErr(""); setOpen(true); }}>
          <Plus className="h-4 w-4" />Catat Terlambat
        </Button>
      </div>

      {records.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
          <Clock className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-slate-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada catatan keterlambatan hari ini.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-950 text-left text-xs text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Siswa</th>
                <th className="px-4 py-3">Waktu Tiba</th>
                <th className="px-4 py-3">Alasan</th>
                <th className="px-4 py-3">Sanksi</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">{r.studentName}</p>
                    <p className="text-xs text-gray-400">{r.className}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {new Date(r.arrivalTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.reason ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.sanction ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => remove(r.id)} disabled={pending}>
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
          <DialogHeader><DialogTitle>Catat Keterlambatan</DialogTitle></DialogHeader>
          <form action={submit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Siswa *</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {s.className}{s.nis ? ` (${s.nis})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="arrivalTime">Waktu Tiba</Label>
              <Input
                id="arrivalTime" name="arrivalTime" type="time"
                defaultValue={new Date().toTimeString().slice(0, 5)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">Alasan (opsional)</Label>
              <Input id="reason" name="reason" placeholder="Contoh: Terlambat bangun" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sanction">Sanksi (opsional)</Label>
              <Input id="sanction" name="sanction" placeholder="Contoh: Membersihkan halaman" />
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
