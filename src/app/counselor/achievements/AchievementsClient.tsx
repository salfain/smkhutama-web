"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Award } from "lucide-react";
import { saveAchievement, deleteAchievement } from "../actions";
import { useConfirm } from "@/components/ConfirmDialog";

type Student = { id: string; name: string; nis: string; className: string };
type Achievement = {
  id: string; studentId: string; studentName: string; className: string;
  title: string; description: string; points: number; level: string; date: string | Date;
};

const LEVELS = ["Sekolah", "Kecamatan", "Kota/Kabupaten", "Provinsi", "Nasional", "Internasional"];
const toDateInput = (d: string | Date) => new Date(d).toISOString().slice(0, 10);

export function AchievementsClient({ achievements, students }: { achievements: Achievement[]; students: Student[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [studentId, setStudentId] = useState("");
  const [level, setLevel] = useState("Sekolah");
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function openCreate() {
    setEditing(null); setStudentId(""); setLevel("Sekolah"); setErr(""); setOpen(true);
  }
  function openEdit(a: Achievement) {
    setEditing(a); setStudentId(a.studentId); setLevel(a.level || "Sekolah"); setErr(""); setOpen(true);
  }
  function submit(fd: FormData) {
    setErr("");
    if (editing) fd.set("id", editing.id);
    fd.set("studentId", studentId); fd.set("level", level);
    startTransition(async () => {
      const r = await saveAchievement(fd);
      if (r.error) setErr(r.error); else setOpen(false);
    });
  }
  async function remove(id: string) {
    if (!(await confirm("Hapus catatan prestasi ini?"))) return;
    startTransition(async () => { await deleteAchievement(id); });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" className="gap-1.5 bg-purple-600 hover:bg-purple-700" onClick={openCreate}>
          <Plus className="h-4 w-4" />Catat Prestasi
        </Button>
      </div>

      {achievements.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <Award className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada catatan prestasi.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {achievements.map((a) => (
            <div key={a.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 shrink-0">
                  <Award className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">+{a.points}</span>
              </div>
              <p className="mt-3 font-semibold text-gray-900 leading-snug">{a.title}</p>
              <p className="text-xs text-gray-500">{a.studentName} · {a.className}</p>
              {a.level && <p className="mt-1 text-[11px] font-medium text-emerald-600">Tingkat {a.level}</p>}
              {a.description && <p className="mt-2 line-clamp-2 text-xs text-gray-600">{a.description}</p>}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">{new Date(a.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600 hover:bg-purple-50" onClick={() => openEdit(a)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => remove(a.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Catat"} Prestasi</DialogTitle></DialogHeader>
          <form action={submit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Siswa *</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} — {s.className}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Judul Prestasi *</Label><Input name="title" defaultValue={editing?.title ?? ""} placeholder="Juara 1 LKS Web Technology" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tingkat</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Poin</Label><Input name="points" type="number" defaultValue={editing?.points ?? 0} /></div>
            </div>
            <div className="space-y-1.5"><Label>Tanggal</Label><Input name="date" type="date" defaultValue={editing ? toDateInput(editing.date) : toDateInput(new Date())} /></div>
            <div className="space-y-1.5"><Label>Deskripsi</Label><Textarea name="description" defaultValue={editing?.description ?? ""} rows={3} placeholder="Keterangan prestasi" /></div>
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
