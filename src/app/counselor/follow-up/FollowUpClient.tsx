"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gavel, FileText, Trash2, CheckCircle2, Send } from "lucide-react";
import { createSummon, updateSummonStatus, deleteSummon } from "../reports-actions";
import { SP_THRESHOLDS } from "@/lib/bk-points";
import { useConfirm } from "@/components/ConfirmDialog";

type SpLevel = { level: string; min: number; label: string };
type StudentRow = { studentId: string; name: string; className: string; points: number; recommended: SpLevel | null; lastSummonLevel: string | null };
type Summon = { id: string; studentName: string; className: string; level: string; reason: string; totalPoints: number; meetingDate: string | Date | null; status: string; createdAt: string | Date };

const statusCls: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Belum dikirim", cls: "bg-gray-100 text-gray-700" },
  SENT: { label: "Terkirim", cls: "bg-blue-100 text-blue-700" },
  DONE: { label: "Selesai", cls: "bg-green-100 text-green-700" },
};
const levelCls: Record<string, string> = {
  SP1: "bg-yellow-100 text-yellow-700", SP2: "bg-blue-100 text-blue-700",
  SP3: "bg-red-100 text-red-700", PANGGILAN: "bg-purple-100 text-purple-700",
};
const fmt = (d: string | Date) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export function FollowUpClient({ students, summons }: { students: StudentRow[]; summons: Summon[] }) {
  const [tab, setTab] = useState<"perlu" | "surat">("perlu");
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<StudentRow | null>(null);
  const [level, setLevel] = useState("SP1");
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function openSummon(s: StudentRow) {
    setTarget(s); setLevel(s.recommended?.level ?? "SP1"); setErr(""); setOpen(true);
  }
  function submit(fd: FormData) {
    setErr("");
    if (!target) return;
    fd.set("studentId", target.studentId);
    fd.set("level", level);
    fd.set("totalPoints", String(target.points));
    startTransition(async () => {
      const r = await createSummon(fd);
      if (r.error) setErr(r.error); else setOpen(false);
    });
  }
  function setStatus(id: string, status: "SENT" | "DONE") {
    startTransition(async () => { await updateSummonStatus(id, status); });
  }
  async function remove(id: string) {
    if (!(await confirm("Hapus surat pemanggilan ini?"))) return;
    startTransition(async () => { await deleteSummon(id); });
  }

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        <button onClick={() => setTab("perlu")} className={`rounded-lg px-4 py-1.5 text-sm font-medium ${tab === "perlu" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}>
          Perlu Tindak Lanjut <span className="text-xs text-gray-400">({students.filter((s) => s.recommended).length})</span>
        </button>
        <button onClick={() => setTab("surat")} className={`rounded-lg px-4 py-1.5 text-sm font-medium ${tab === "surat" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}>
          Surat Pemanggilan <span className="text-xs text-gray-400">({summons.length})</span>
        </button>
      </div>

      {tab === "perlu" && (
        <>
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            {SP_THRESHOLDS.slice().reverse().map((t) => (
              <span key={t.level} className={`rounded-full px-2.5 py-1 font-medium ${levelCls[t.level]}`}>≥ {t.min}: {t.label}</span>
            ))}
          </div>
          {students.length === 0 ? (
            <Empty text="Belum ada siswa dengan poin pelanggaran." />
          ) : (
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs text-gray-500">
                  <tr><th className="px-4 py-3">Siswa</th><th className="px-4 py-3 text-center">Poin</th><th className="px-4 py-3">Rekomendasi</th><th className="px-4 py-3"></th></tr>
                </thead>
                <tbody className="divide-y">
                  {students.map((s) => (
                    <tr key={s.studentId} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><p className="font-medium text-gray-900">{s.name}</p><p className="text-xs text-gray-400">{s.className}</p></td>
                      <td className="px-4 py-3 text-center"><span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">{s.points}</span></td>
                      <td className="px-4 py-3">
                        {s.recommended ? (
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${levelCls[s.recommended.level]}`}>{s.recommended.label}</span>
                        ) : <span className="text-xs text-gray-400">Belum perlu</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {s.recommended && (
                          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openSummon(s)}>
                            <Gavel className="h-3.5 w-3.5" />Buat Surat
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "surat" && (
        summons.length === 0 ? <Empty text="Belum ada surat pemanggilan." /> : (
          <div className="space-y-3">
            {summons.map((s) => (
              <div key={s.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{s.studentName}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${levelCls[s.level]}`}>{s.level}</span>
                    </div>
                    <p className="text-xs text-gray-500">{s.className} · {s.totalPoints} poin</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusCls[s.status].cls}`}>{statusCls[s.status].label}</span>
                </div>
                <p className="mt-2 text-xs text-gray-600">{s.reason}</p>
                <p className="text-[11px] text-gray-400 mt-1">Dibuat {fmt(s.createdAt)}{s.meetingDate && ` · Pertemuan: ${fmt(s.meetingDate)}`}</p>
                <div className="mt-3 flex flex-wrap justify-end gap-1.5">
                  <a href={`/counselor/summons/${s.id}/print`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Cetak Surat</Button>
                  </a>
                  {s.status === "PENDING" && <Button variant="ghost" size="sm" className="gap-1.5 text-blue-600 hover:bg-blue-50" onClick={() => setStatus(s.id, "SENT")}><Send className="h-3.5 w-3.5" />Tandai Terkirim</Button>}
                  {s.status !== "DONE" && <Button variant="ghost" size="sm" className="gap-1.5 text-green-600 hover:bg-green-50" onClick={() => setStatus(s.id, "DONE")}><CheckCircle2 className="h-3.5 w-3.5" />Selesai</Button>}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => remove(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Buat Surat Pemanggilan</DialogTitle></DialogHeader>
          {target && (
            <form action={submit} className="space-y-4 pt-2">
              <div className="rounded-lg bg-gray-50 p-3 text-sm">
                <p className="font-medium text-gray-800">{target.name}</p>
                <p className="text-xs text-gray-500">{target.className} · {target.points} poin pelanggaran</p>
              </div>
              <div className="space-y-1.5">
                <Label>Tingkat</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SP1">Surat Peringatan 1</SelectItem>
                    <SelectItem value="SP2">Surat Peringatan 2</SelectItem>
                    <SelectItem value="SP3">Surat Peringatan 3</SelectItem>
                    <SelectItem value="PANGGILAN">Pemanggilan Orang Tua</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Alasan / Keterangan *</Label><Textarea name="reason" rows={3} placeholder="Contoh: Akumulasi pelanggaran terlambat dan tidak mengerjakan tugas" required /></div>
              <div className="space-y-1.5"><Label>Tanggal Pertemuan</Label><Input name="meetingDate" type="date" /></div>
              {err && <p className="text-sm text-red-600">{err}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={pending}>Simpan</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
      <Gavel className="mx-auto mb-2 h-8 w-8 text-gray-300" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}
