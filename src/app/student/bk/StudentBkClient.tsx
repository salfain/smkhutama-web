"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShieldAlert, Award, MessagesSquare, Plus, Lock, Trash2, Send, Scale, ClipboardList, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { submitCounselingRequest, cancelCounselingRequest } from "./actions";

type Violation = { id: string; typeName: string | null; description: string; points: number; sanction: string; date: string | Date };
type Achievement = { id: string; title: string; description: string; points: number; level: string; date: string | Date };
type Case = { id: string; title: string; type: string; status: string; description: string | null; followUp: string | null; isConfidential: boolean; sessionDate: string | Date };
type Request = { id: string; topic: string; description: string; urgency: string; status: string; response: string; preferredDate: string | Date | null; createdAt: string | Date };

type Data = {
  violationPoints: number; achievementPoints: number; netPoints: number;
  violations: Violation[]; achievements: Achievement[]; cases: Case[]; requests: Request[];
};
type Survey = { id: string; title: string; description: string; questionCount: number; answered: boolean };

const typeLabel: Record<string, string> = { PRIBADI: "Pribadi", SOSIAL: "Sosial", BELAJAR: "Belajar", KARIR: "Karir" };
const caseStatus: Record<string, { label: string; cls: string }> = {
  OPEN: { label: "Terbuka", cls: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "Proses", cls: "bg-amber-100 text-amber-700" },
  RESOLVED: { label: "Selesai", cls: "bg-green-100 text-green-700" },
  REFERRED: { label: "Rujukan", cls: "bg-purple-100 text-purple-700" },
};
const reqStatus: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Menunggu", cls: "bg-gray-100 text-gray-700" },
  APPROVED: { label: "Disetujui", cls: "bg-blue-100 text-blue-700" },
  SCHEDULED: { label: "Dijadwalkan", cls: "bg-amber-100 text-amber-700" },
  DONE: { label: "Selesai", cls: "bg-green-100 text-green-700" },
  REJECTED: { label: "Ditolak", cls: "bg-red-100 text-red-700" },
};
const fmt = (d: string | Date) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export function StudentBkClient({ data, surveys }: { data: Data; surveys: Survey[] }) {
  const [tab, setTab] = useState<"konseling" | "pelanggaran" | "prestasi" | "permohonan" | "angket">("konseling");
  const [open, setOpen] = useState(false);
  const [urgency, setUrgency] = useState("SEDANG");
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(fd: FormData) {
    setErr("");
    fd.set("urgency", urgency);
    startTransition(async () => {
      const r = await submitCounselingRequest(fd);
      if (r.error) setErr(r.error); else { setOpen(false); setUrgency("SEDANG"); }
    });
  }
  function cancel(id: string) {
    if (!confirm("Batalkan permohonan ini?")) return;
    startTransition(async () => { await cancelCounselingRequest(id); });
  }

  const tabs = [
    { key: "konseling" as const, label: "Konseling", count: data.cases.length },
    { key: "pelanggaran" as const, label: "Pelanggaran", count: data.violations.length },
    { key: "prestasi" as const, label: "Prestasi", count: data.achievements.length },
    { key: "permohonan" as const, label: "Permohonan", count: data.requests.length },
    { key: "angket" as const, label: "Angket", count: surveys.filter((s) => !s.answered).length },
  ];

  return (
    <div>
      {/* Ringkasan poin */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-red-500"><ShieldAlert className="h-5 w-5 text-white" /></div>
          <p className="text-2xl font-bold text-red-600">{data.violationPoints}</p>
          <p className="text-xs text-gray-500">Poin Pelanggaran</p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500"><Award className="h-5 w-5 text-white" /></div>
          <p className="text-2xl font-bold text-emerald-600">{data.achievementPoints}</p>
          <p className="text-xs text-gray-500">Poin Prestasi</p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500"><Scale className="h-5 w-5 text-white" /></div>
          <p className={`text-2xl font-bold ${data.netPoints < 0 ? "text-red-600" : "text-blue-600"}`}>{data.netPoints}</p>
          <p className="text-xs text-gray-500">Poin Bersih</p>
        </div>
      </div>

      {/* Tabs + tombol ajukan */}
      <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                tab === t.key ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}>
              {t.label} <span className="text-xs text-gray-400">({t.count})</span>
            </button>
          ))}
        </div>
        <Button size="sm" className="gap-1.5 bg-purple-600 hover:bg-purple-700" onClick={() => { setErr(""); setOpen(true); }}>
          <Plus className="h-4 w-4" />Ajukan Konseling
        </Button>
      </div>

      {/* Konten tab */}
      {tab === "konseling" && (
        data.cases.length === 0 ? <Empty icon={MessagesSquare} text="Belum ada sesi konseling." /> : (
          <div className="space-y-3">
            {data.cases.map((c) => (
              <div key={c.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-gray-900">{c.title}</p>
                    {c.isConfidential && <Lock className="h-3.5 w-3.5 text-gray-400" />}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${caseStatus[c.status].cls}`}>{caseStatus[c.status].label}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{typeLabel[c.type]} · {fmt(c.sessionDate)}</p>
                {c.isConfidential ? (
                  <p className="mt-2 text-xs italic text-gray-400">Detail bersifat rahasia. Hubungi guru BK untuk informasi lebih lanjut.</p>
                ) : (
                  <>
                    {c.description && <p className="mt-2 text-sm text-gray-600">{c.description}</p>}
                    {c.followUp && <p className="mt-1 text-xs text-emerald-600">Tindak lanjut: {c.followUp}</p>}
                  </>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === "pelanggaran" && (
        data.violations.length === 0 ? <Empty icon={ShieldAlert} text="Tidak ada catatan pelanggaran. Pertahankan!" /> : (
          <div className="space-y-2">
            {data.violations.map((v) => (
              <div key={v.id} className="flex items-start justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm">
                <div>
                  {v.typeName && <p className="text-sm font-medium text-gray-800">{v.typeName}</p>}
                  <p className="text-xs text-gray-500">{v.description}</p>
                  {v.sanction && <p className="text-[11px] text-amber-600 mt-0.5">Sanksi: {v.sanction}</p>}
                  <p className="text-[11px] text-gray-400 mt-0.5">{fmt(v.date)}</p>
                </div>
                <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">{v.points}</span>
              </div>
            ))}
          </div>
        )
      )}

      {tab === "prestasi" && (
        data.achievements.length === 0 ? <Empty icon={Award} text="Belum ada catatan prestasi." /> : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.achievements.map((a) => (
              <div key={a.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100"><Award className="h-5 w-5 text-emerald-600" /></div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">+{a.points}</span>
                </div>
                <p className="mt-3 font-semibold text-gray-900">{a.title}</p>
                {a.level && <p className="text-[11px] font-medium text-emerald-600">Tingkat {a.level}</p>}
                {a.description && <p className="mt-1 text-xs text-gray-600">{a.description}</p>}
                <p className="text-[11px] text-gray-400 mt-1">{fmt(a.date)}</p>
              </div>
            ))}
          </div>
        )
      )}

      {tab === "permohonan" && (
        data.requests.length === 0 ? <Empty icon={Send} text="Belum ada permohonan konseling." /> : (
          <div className="space-y-3">
            {data.requests.map((r) => (
              <div key={r.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900">{r.topic}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${reqStatus[r.status].cls}`}>{reqStatus[r.status].label}</span>
                </div>
                {r.description && <p className="mt-1 text-xs text-gray-600">{r.description}</p>}
                <p className="text-[11px] text-gray-400 mt-1">Diajukan {fmt(r.createdAt)}{r.preferredDate && ` · Preferensi: ${fmt(r.preferredDate)}`}</p>
                {r.response && <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">Tanggapan BK: {r.response}</p>}
                {r.status === "PENDING" && (
                  <Button variant="ghost" size="sm" className="mt-2 h-7 gap-1 text-red-500 hover:bg-red-50" onClick={() => cancel(r.id)}>
                    <Trash2 className="h-3.5 w-3.5" />Batalkan
                  </Button>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === "angket" && (
        surveys.length === 0 ? <Empty icon={ClipboardList} text="Belum ada angket yang tersedia." /> : (
          <div className="space-y-3">
            {surveys.map((s) => (
              <div key={s.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{s.title}</p>
                    {s.description && <p className="text-xs text-gray-500 line-clamp-2">{s.description}</p>}
                    <p className="mt-1 text-[11px] text-gray-400">{s.questionCount} pertanyaan</p>
                  </div>
                  {s.answered ? (
                    <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">Sudah diisi</span>
                  ) : (
                    <Link href={`/student/bk/survey/${s.id}`}>
                      <Button size="sm" className="gap-1 bg-purple-600 hover:bg-purple-700">Isi <ChevronRight className="h-3.5 w-3.5" /></Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Dialog ajukan konseling */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Ajukan Permohonan Konseling</DialogTitle></DialogHeader>
          <form action={submit} className="space-y-4 pt-2">
            <div className="space-y-1.5"><Label>Topik / Keperluan *</Label><Input name="topic" placeholder="Contoh: Konsultasi pemilihan jurusan kuliah" required /></div>
            <div className="space-y-1.5"><Label>Penjelasan</Label><Textarea name="description" rows={3} placeholder="Ceritakan singkat hal yang ingin dikonsultasikan" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tingkat Urgensi</Label>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RENDAH">Rendah</SelectItem>
                    <SelectItem value="SEDANG">Sedang</SelectItem>
                    <SelectItem value="TINGGI">Tinggi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Tanggal Diharapkan</Label><Input name="preferredDate" type="date" /></div>
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={pending}>Kirim Permohonan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: typeof ShieldAlert; text: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
      <Icon className="mx-auto mb-2 h-8 w-8 text-gray-300" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}
