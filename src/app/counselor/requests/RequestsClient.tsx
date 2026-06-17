"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Inbox, MessageSquareReply, CalendarPlus } from "lucide-react";
import { respondRequest, convertRequestToCase } from "../actions";
import { useConfirm } from "@/components/ConfirmDialog";

type Request = {
  id: string; studentName: string; className: string; topic: string; description: string;
  urgency: string; status: string; response: string; preferredDate: string | Date | null; createdAt: string | Date;
};

const STATUSES = [["PENDING", "Menunggu"], ["APPROVED", "Disetujui"], ["SCHEDULED", "Dijadwalkan"], ["DONE", "Selesai"], ["REJECTED", "Ditolak"]];
const statusCls: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700", APPROVED: "bg-blue-100 text-blue-700",
  SCHEDULED: "bg-sky-100 text-sky-700", DONE: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-700",
};
const urgencyCls: Record<string, string> = {
  RENDAH: "bg-slate-100 text-slate-600", SEDANG: "bg-sky-100 text-sky-700", TINGGI: "bg-red-100 text-red-700",
};
const fmt = (d: string | Date) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export function RequestsClient({ requests }: { requests: Request[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Request | null>(null);
  const [status, setStatus] = useState("PENDING");
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function openRespond(r: Request) {
    setEditing(r); setStatus(r.status); setErr(""); setOpen(true);
  }
  function submit(fd: FormData) {
    setErr("");
    if (editing) fd.set("id", editing.id);
    fd.set("status", status);
    startTransition(async () => {
      const r = await respondRequest(fd);
      if (r.error) setErr(r.error); else setOpen(false);
    });
  }
  async function makeSession(id: string) {
    const ok = await confirm({
      title: "Terima permohonan?",
      description: "Permohonan ini akan dibuatkan sesi konseling dan ditandai 'Dijadwalkan'.",
      confirmText: "Ya, Buat Sesi",
      variant: "info",
      icon: "info",
    });
    if (!ok) return;
    startTransition(async () => {
      await convertRequestToCase(id);
    });
  }

  return (
    <div>
      {requests.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <Inbox className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada permohonan konseling.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{r.topic}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${urgencyCls[r.urgency] ?? urgencyCls.SEDANG}`}>{r.urgency}</span>
                  </div>
                  <p className="text-xs text-gray-500">{r.studentName} · {r.className}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusCls[r.status]}`}>
                  {STATUSES.find(([k]) => k === r.status)?.[1]}
                </span>
              </div>
              {r.description && <p className="mt-2 text-sm text-gray-600">{r.description}</p>}
              <p className="text-[11px] text-gray-400 mt-1">Diajukan {fmt(r.createdAt)}{r.preferredDate && ` · Preferensi: ${fmt(r.preferredDate)}`}</p>
              {r.response && <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">Tanggapan: {r.response}</p>}
              <div className="mt-3 flex justify-end gap-2">
                {(r.status === "PENDING" || r.status === "APPROVED") && (
                  <Button variant="outline" size="sm" className="gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50" onClick={() => makeSession(r.id)} disabled={pending}>
                    <CalendarPlus className="h-3.5 w-3.5" />Jadikan Sesi
                  </Button>
                )}
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openRespond(r)}>
                  <MessageSquareReply className="h-3.5 w-3.5" />Tanggapi
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Tanggapi Permohonan</DialogTitle></DialogHeader>
          <form action={submit} className="space-y-4 pt-2">
            {editing && (
              <div className="rounded-lg bg-gray-50 p-3 text-sm">
                <p className="font-medium text-gray-800">{editing.topic}</p>
                <p className="text-xs text-gray-500">{editing.studentName} · {editing.className}</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Tanggapan untuk Siswa</Label><Textarea name="response" defaultValue={editing?.response ?? ""} rows={3} placeholder="Contoh: Silakan datang ke ruang BK hari Selasa pukul 10.00" /></div>
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
