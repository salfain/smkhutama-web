"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Home as HomeIcon, FileText } from "lucide-react";
import { saveHomeVisit, deleteHomeVisit } from "../bk-actions";

type Student = { id: string; name: string; nis: string; className: string };
type Visit = {
  id: string; studentId: string; studentName: string; className: string;
  visitDate: string | Date; purpose: string; address: string; findings: string; result: string;
};
const toDateInput = (d: string | Date) => new Date(d).toISOString().slice(0, 10);
const fmt = (d: string | Date) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export function HomeVisitsClient({ visits, students }: { visits: Visit[]; students: Student[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Visit | null>(null);
  const [studentId, setStudentId] = useState("");
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();

  function openCreate() { setEditing(null); setStudentId(""); setErr(""); setOpen(true); }
  function openEdit(v: Visit) { setEditing(v); setStudentId(v.studentId); setErr(""); setOpen(true); }
  function submit(fd: FormData) {
    setErr("");
    if (editing) fd.set("id", editing.id);
    fd.set("studentId", studentId);
    startTransition(async () => {
      const r = await saveHomeVisit(fd);
      if (r.error) setErr(r.error); else setOpen(false);
    });
  }
  function remove(id: string) {
    if (!confirm("Hapus catatan kunjungan ini?")) return;
    startTransition(async () => { await deleteHomeVisit(id); });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" className="gap-1.5 bg-purple-600 hover:bg-purple-700" onClick={openCreate}>
          <Plus className="h-4 w-4" />Tambah Kunjungan
        </Button>
      </div>

      {visits.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <HomeIcon className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada catatan kunjungan rumah.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visits.map((v) => (
            <div key={v.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{v.studentName}</p>
                  <p className="text-xs text-gray-500">{v.className} · {fmt(v.visitDate)}</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-700">{v.purpose}</p>
              {v.result && <p className="mt-1 text-xs text-emerald-600">Hasil: {v.result}</p>}
              <div className="mt-3 flex justify-end gap-1">
                <a href={`/counselor/home-visits/${v.id}/print`} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" title="Cetak PDF"><FileText className="h-3.5 w-3.5" /></Button>
                </a>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600 hover:bg-purple-50" onClick={() => openEdit(v)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => remove(v.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Tambah"} Kunjungan Rumah</DialogTitle></DialogHeader>
          <form action={submit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Siswa *</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
                <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} — {s.className}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Tanggal Kunjungan</Label><Input name="visitDate" type="date" defaultValue={editing ? toDateInput(editing.visitDate) : toDateInput(new Date())} /></div>
            <div className="space-y-1.5"><Label>Tujuan Kunjungan *</Label><Input name="purpose" defaultValue={editing?.purpose ?? ""} placeholder="Contoh: Klarifikasi ketidakhadiran siswa" required /></div>
            <div className="space-y-1.5"><Label>Alamat</Label><Input name="address" defaultValue={editing?.address ?? ""} placeholder="Alamat rumah siswa" /></div>
            <div className="space-y-1.5"><Label>Temuan / Kondisi</Label><Textarea name="findings" defaultValue={editing?.findings ?? ""} rows={3} placeholder="Kondisi yang ditemukan saat kunjungan" /></div>
            <div className="space-y-1.5"><Label>Hasil / Kesepakatan</Label><Textarea name="result" defaultValue={editing?.result ?? ""} rows={2} placeholder="Hasil dan kesepakatan dengan orang tua" /></div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={pending}>Simpan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
