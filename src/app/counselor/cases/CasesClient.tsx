"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, MessagesSquare, Lock, FileDown } from "lucide-react";
import { saveCase, deleteCase } from "../actions";
import { useConfirm } from "@/components/ConfirmDialog";

type Student = { id: string; name: string; nis: string; className: string };
type Case = {
  id: string; studentId: string; studentName: string; className: string;
  type: string; status: string; title: string; description: string; notes: string; followUp: string;
  isConfidential: boolean; sessionDate: string | Date;
};

const TYPES = [["PRIBADI", "Pribadi"], ["SOSIAL", "Sosial"], ["BELAJAR", "Belajar"], ["KARIR", "Karir"]];
const STATUSES = [["OPEN", "Terbuka"], ["IN_PROGRESS", "Proses"], ["RESOLVED", "Selesai"], ["REFERRED", "Rujukan"]];
const statusCls: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700", IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-green-100 text-green-700", REFERRED: "bg-purple-100 text-purple-700",
};

function toDateInput(d: string | Date) {
  return new Date(d).toISOString().slice(0, 10);
}

export function CasesClient({ cases, students }: { cases: Case[]; students: Student[] }) {
  const [tab, setTab] = useState<"active" | "history">("active");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Case | null>(null);
  const [studentId, setStudentId] = useState("");
  const [type, setType] = useState("PRIBADI");
  const [status, setStatus] = useState("OPEN");
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  const activeCases = cases.filter((c) => c.status !== "RESOLVED");
  const historyCases = cases.filter((c) => c.status === "RESOLVED");
  const shown = tab === "active" ? activeCases : historyCases;

  function openCreate() {
    setEditing(null); setStudentId(""); setType("PRIBADI"); setStatus("OPEN"); setErr(""); setOpen(true);
  }
  function openEdit(c: Case) {
    setEditing(c); setStudentId(c.studentId); setType(c.type); setStatus(c.status); setErr(""); setOpen(true);
  }
  function submit(fd: FormData) {
    setErr("");
    if (editing) fd.set("id", editing.id);
    fd.set("studentId", studentId); fd.set("type", type); fd.set("status", status);
    startTransition(async () => {
      const r = await saveCase(fd);
      if (r.error) setErr(r.error); else setOpen(false);
    });
  }
  async function remove(id: string) {
    if (!(await confirm("Hapus sesi konseling ini?"))) return;
    startTransition(async () => { await deleteCase(id); });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
        {/* Toggle: Sesi Aktif / Riwayat */}
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          <button onClick={() => setTab("active")}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
              tab === "active" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}>
            Sesi Aktif <span className="text-xs text-gray-400">({activeCases.length})</span>
          </button>
          <button onClick={() => setTab("history")}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
              tab === "history" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}>
            Riwayat <span className="text-xs text-gray-400">({historyCases.length})</span>
          </button>
        </div>
        <Button size="sm" className="gap-1.5 bg-purple-600 hover:bg-purple-700" onClick={openCreate}>
          <Plus className="h-4 w-4" />Tambah Sesi
        </Button>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <MessagesSquare className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">
            {tab === "active" ? "Belum ada sesi konseling aktif." : "Belum ada riwayat sesi selesai."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {shown.map((c) => (
            <div key={c.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-gray-900">{c.title}</p>
                    {c.isConfidential && <Lock className="h-3.5 w-3.5 text-gray-400" />}
                  </div>
                  <p className="text-xs text-gray-500">{c.studentName} · {c.className}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusCls[c.status]}`}>
                  {STATUSES.find(([k]) => k === c.status)?.[1]}
                </span>
              </div>
              {c.description && <p className="mt-2 line-clamp-2 text-xs text-gray-600">{c.description}</p>}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  {TYPES.find(([k]) => k === c.type)?.[1]} · {new Date(c.sessionDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <div className="flex gap-1">
                  {c.status === "RESOLVED" && (
                    <a href={`/counselor/cases/${c.id}/print`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" title="Ekspor PDF">
                        <FileDown className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600 hover:bg-purple-50" onClick={() => openEdit(c)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => remove(c.id)}>
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
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Tambah"} Sesi Konseling</DialogTitle></DialogHeader>
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
            <div className="space-y-1.5"><Label>Judul / Topik *</Label><Input name="title" defaultValue={editing?.title ?? ""} placeholder="Contoh: Konseling motivasi belajar" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Jenis</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Tanggal Sesi</Label><Input name="sessionDate" type="date" defaultValue={editing ? toDateInput(editing.sessionDate) : toDateInput(new Date())} /></div>
            <div className="space-y-1.5"><Label>Deskripsi / Permasalahan</Label><Textarea name="description" defaultValue={editing?.description ?? ""} rows={3} placeholder="Uraian permasalahan" /></div>
            <div className="space-y-1.5"><Label>Catatan Konseling</Label><Textarea name="notes" defaultValue={editing?.notes ?? ""} rows={3} placeholder="Catatan selama sesi konseling berlangsung" /></div>
            <div className="space-y-1.5"><Label>Tindak Lanjut</Label><Textarea name="followUp" defaultValue={editing?.followUp ?? ""} rows={2} placeholder="Rencana / hasil tindak lanjut" /></div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="isConfidential" defaultChecked={editing ? editing.isConfidential : true} className="h-4 w-4 rounded border-gray-300" />
              Rahasia (hanya guru BK & admin)
            </label>
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
