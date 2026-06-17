"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, ShieldAlert, Settings2 } from "lucide-react";
import { saveViolation, deleteViolation, saveViolationType, deleteViolationType } from "../actions";
import { useConfirm } from "@/components/ConfirmDialog";

type Student = { id: string; name: string; nis: string; className: string };
type VType = { id: string; name: string; category: string; points: number };
type Violation = {
  id: string; studentId: string; studentName: string; className: string;
  typeName: string | null; description: string; points: number; sanction: string; date: string | Date;
};

const CATS = [["RINGAN", "Ringan"], ["SEDANG", "Sedang"], ["BERAT", "Berat"]];
const catCls: Record<string, string> = {
  RINGAN: "bg-yellow-100 text-yellow-700", SEDANG: "bg-blue-100 text-blue-700", BERAT: "bg-red-100 text-red-700",
};
const toDateInput = (d: string | Date) => new Date(d).toISOString().slice(0, 10);

export function ViolationsClient({ violations, types, students }: { violations: Violation[]; types: VType[]; students: Student[] }) {
  const [open, setOpen] = useState(false);
  const [typesOpen, setTypesOpen] = useState(false);
  const [editing, setEditing] = useState<Violation | null>(null);
  const [studentId, setStudentId] = useState("");
  const [typeId, setTypeId] = useState("none");
  const [points, setPoints] = useState(0);
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function openCreate() {
    setEditing(null); setStudentId(""); setTypeId("none"); setPoints(0); setErr(""); setOpen(true);
  }
  function openEdit(v: Violation) {
    setEditing(v); setStudentId(v.studentId); setTypeId("none"); setPoints(v.points); setErr(""); setOpen(true);
  }
  function onTypeChange(id: string) {
    setTypeId(id);
    const t = types.find((x) => x.id === id);
    if (t) setPoints(t.points);
  }
  function submit(fd: FormData) {
    setErr("");
    if (editing) fd.set("id", editing.id);
    fd.set("studentId", studentId);
    fd.set("violationTypeId", typeId === "none" ? "" : typeId);
    fd.set("points", String(points));
    startTransition(async () => {
      const r = await saveViolation(fd);
      if (r.error) setErr(r.error); else setOpen(false);
    });
  }
  async function remove(id: string) {
    if (!(await confirm("Hapus catatan pelanggaran ini?"))) return;
    startTransition(async () => { await deleteViolation(id); });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end gap-2">
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setTypesOpen(true)}>
          <Settings2 className="h-4 w-4" />Jenis Pelanggaran
        </Button>
        <Button size="sm" className="gap-1.5 bg-purple-600 hover:bg-purple-700" onClick={openCreate}>
          <Plus className="h-4 w-4" />Catat Pelanggaran
        </Button>
      </div>

      {violations.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <ShieldAlert className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada catatan pelanggaran.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3">Siswa</th>
                <th className="px-4 py-3">Pelanggaran</th>
                <th className="px-4 py-3 text-center">Poin</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {violations.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{v.studentName}</p>
                    <p className="text-xs text-gray-400">{v.className}</p>
                  </td>
                  <td className="px-4 py-3">
                    {v.typeName && <p className="text-xs font-medium text-gray-700">{v.typeName}</p>}
                    <p className="text-xs text-gray-500">{v.description}</p>
                    {v.sanction && <p className="text-[11px] text-sky-600">Sanksi: {v.sanction}</p>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">{v.points}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(v.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600 hover:bg-purple-50" onClick={() => openEdit(v)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => remove(v.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog catat pelanggaran */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Catat"} Pelanggaran</DialogTitle></DialogHeader>
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
            <div className="space-y-1.5">
              <Label>Jenis Pelanggaran</Label>
              <Select value={typeId} onValueChange={onTypeChange}>
                <SelectTrigger><SelectValue placeholder="Pilih (opsional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Lainnya / manual —</SelectItem>
                  {types.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} ({t.points} poin)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Deskripsi *</Label><Input name="description" defaultValue={editing?.description ?? ""} placeholder="Keterangan pelanggaran" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Poin</Label>
                <Input type="number" value={points} onChange={(e) => setPoints(parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-1.5"><Label>Tanggal</Label><Input name="date" type="date" defaultValue={editing ? toDateInput(editing.date) : toDateInput(new Date())} /></div>
            </div>
            <div className="space-y-1.5"><Label>Sanksi</Label><Input name="sanction" defaultValue={editing?.sanction ?? ""} placeholder="Contoh: Surat peringatan" /></div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={pending}>Simpan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog kelola jenis pelanggaran */}
      <ViolationTypesDialog open={typesOpen} onOpenChange={setTypesOpen} types={types} />
    </div>
  );
}

function ViolationTypesDialog({ open, onOpenChange, types }: { open: boolean; onOpenChange: (v: boolean) => void; types: VType[] }) {
  const [editing, setEditing] = useState<VType | null>(null);
  const [category, setCategory] = useState("RINGAN");
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function submit(fd: FormData) {
    setErr("");
    if (editing) fd.set("id", editing.id);
    fd.set("category", category);
    startTransition(async () => {
      const r = await saveViolationType(fd);
      if (r.error) setErr(r.error); else { setEditing(null); setCategory("RINGAN"); }
    });
  }
  async function remove(id: string) {
    if (!(await confirm("Hapus jenis pelanggaran ini?"))) return;
    startTransition(async () => { await deleteViolationType(id); });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Jenis Pelanggaran & Poin</DialogTitle></DialogHeader>
        <form action={submit} className="grid grid-cols-12 gap-2 items-end border-b pb-4">
          <div className="col-span-5 space-y-1"><Label className="text-xs">Nama</Label><Input name="name" defaultValue={editing?.name ?? ""} key={editing?.id ?? "new"} placeholder="Terlambat" required /></div>
          <div className="col-span-4 space-y-1">
            <Label className="text-xs">Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATS.map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1"><Label className="text-xs">Poin</Label><Input name="points" type="number" defaultValue={editing?.points ?? 0} key={(editing?.id ?? "new") + "p"} /></div>
          <div className="col-span-1"><Button type="submit" size="icon" className="bg-purple-600 hover:bg-purple-700" disabled={pending}><Plus className="h-4 w-4" /></Button></div>
          {err && <p className="col-span-12 text-xs text-red-600">{err}</p>}
        </form>
        <div className="space-y-2 pt-2">
          {types.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada jenis pelanggaran.</p>
          ) : types.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
              <div className="flex items-center gap-2">
                <Badge className={`${catCls[t.category]} border-0`}>{CATS.find(([k]) => k === t.category)?.[1]}</Badge>
                <span className="text-sm text-gray-800">{t.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{t.points} poin</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-purple-600" onClick={() => { setEditing(t); setCategory(t.category); }}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => remove(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
