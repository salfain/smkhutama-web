"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, LogOut, CheckCircle2 } from "lucide-react";
import { createPermit, markPermitReturned, deletePermit } from "../actions";
import { useConfirm } from "@/components/ConfirmDialog";

type Student = { id: string; name: string; className: string; nis: string | null };
type PermitRecord = {
  id: string; studentName: string; className: string; reason: string;
  exitTime: Date | null; returnTime: Date | null; status: string;
};

const statusStyle: Record<string, string> = {
  KELUAR: "bg-red-100 text-red-700 border-red-200",
  SUDAH_KEMBALI: "bg-green-100 text-green-700 border-green-200",
  TIDAK_KEMBALI: "bg-gray-100 text-gray-600 border-gray-200",
};
const statusLabel: Record<string, string> = {
  KELUAR: "Keluar", SUDAH_KEMBALI: "Kembali", TIDAK_KEMBALI: "Tidak Kembali",
};

export function PermitClient({ records, students }: { records: PermitRecord[]; students: Student[] }) {
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function submit(fd: FormData) {
    setErr("");
    fd.set("studentId", studentId);
    startTransition(async () => {
      const r = await createPermit(fd);
      if (r.error) setErr(r.error); else { setOpen(false); setStudentId(""); }
    });
  }

  async function markReturned(id: string) {
    if (!(await confirm("Tandai siswa ini sudah kembali?"))) return;
    startTransition(async () => { await markPermitReturned(id); });
  }

  async function remove(id: string) {
    if (!(await confirm("Hapus catatan izin ini?"))) return;
    startTransition(async () => { await deletePermit(id); });
  }

  const active = records.filter(r => r.status === "KELUAR");
  const done = records.filter(r => r.status !== "KELUAR");

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5 bg-amber-500 hover:bg-amber-600" onClick={() => { setStudentId(""); setErr(""); setOpen(true); }}>
          <Plus className="h-4 w-4" />Catat Izin Keluar
        </Button>
      </div>

      {/* Izin aktif */}
      {active.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <LogOut className="h-4 w-4" />Sedang Keluar ({active.length})
          </h3>
          <div className="overflow-hidden rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm">
            {active.map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-4 py-3.5 border-b dark:border-slate-800 last:border-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 font-bold text-sm dark:bg-red-900/20 dark:text-red-400">
                  {r.studentName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{r.studentName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{r.className} · {r.reason}</p>
                </div>
                <div className="text-xs text-gray-400 shrink-0">
                  {r.exitTime ? new Date(r.exitTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}
                </div>
                <Button size="sm" variant="outline" className="shrink-0 gap-1 text-green-600 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/20" onClick={() => markReturned(r.id)} disabled={pending}>
                  <CheckCircle2 className="h-3.5 w-3.5" />Kembali
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0" onClick={() => remove(r.id)} disabled={pending}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Riwayat izin */}
      {done.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Riwayat Hari Ini</h3>
          <div className="overflow-hidden rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-950 text-left text-xs text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Siswa</th>
                  <th className="px-4 py-3">Alasan</th>
                  <th className="px-4 py-3">Keluar</th>
                  <th className="px-4 py-3">Kembali</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {done.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{r.studentName}</p>
                      <p className="text-xs text-gray-400">{r.className}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.reason}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {r.exitTime ? new Date(r.exitTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {r.returnTime ? new Date(r.returnTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs hover:opacity-100 ${statusStyle[r.status] ?? ""}`}>
                        {statusLabel[r.status] ?? r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-50" onClick={() => remove(r.id)} disabled={pending}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {records.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
          <LogOut className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-slate-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada catatan izin hari ini.</p>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Catat Izin Keluar</DialogTitle></DialogHeader>
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
              <Label htmlFor="reason">Alasan *</Label>
              <Input id="reason" name="reason" placeholder="Contoh: Ke UKS, izin ke kamar mandi" required />
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600" disabled={pending}>Catat Keluar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
