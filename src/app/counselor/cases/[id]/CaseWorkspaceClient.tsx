"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  FileText,
  HeartPulse,
  MapPin,
  MessageSquarePlus,
  MessagesSquare,
  Phone,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
import { useConfirm } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { getCaseWorkspace } from "../../case-workspace-actions";
import {
  addCaseReferral,
  addCounselingSession,
  changeReferralStatus,
  removeCaseReferral,
  removeCounselingSession,
  saveCaseAssessment,
} from "../../case-workspace-actions";

type RecordData = NonNullable<Awaited<ReturnType<typeof getCaseWorkspace>>>;
type Feedback = { success?: boolean; error?: string };
type Tab = "overview" | "sessions" | "referrals";

const statusLabels: Record<string, string> = { OPEN: "Terbuka", IN_PROGRESS: "Dalam proses", RESOLVED: "Selesai", REFERRED: "Dirujuk" };
const priorityLabels: Record<string, string> = { LOW: "Rendah", MEDIUM: "Sedang", HIGH: "Tinggi", CRITICAL: "Kritis" };
const riskLabels: Record<string, string> = { NONE: "Tidak teridentifikasi", LOW: "Rendah", MEDIUM: "Sedang", HIGH: "Tinggi", CRITICAL: "Kritis" };
const modeLabels: Record<string, string> = { INDIVIDUAL: "Individual", GROUP: "Kelompok", PARENT: "Orang tua", TEACHER: "Bersama guru", ONLINE: "Daring" };
const referralLabels: Record<string, string> = { PLANNED: "Direncanakan", SENT: "Dikirim", ACCEPTED: "Diterima", COMPLETED: "Selesai", CANCELLED: "Dibatalkan" };
const referralNext: Record<string, "SENT" | "ACCEPTED" | "COMPLETED"> = { PLANNED: "SENT", SENT: "ACCEPTED", ACCEPTED: "COMPLETED" };

function fullDate(value: string | Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function dateTimeInput(value?: string | Date | null) {
  const date = value ? new Date(value) : new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function CaseWorkspaceClient({ record }: { record: RecordData }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [sessionOpen, setSessionOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({});
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function submitAssessment(data: FormData) {
    setFeedback({});
    startTransition(async () => setFeedback(await saveCaseAssessment(record.id, data)));
  }

  function submitSession(data: FormData) {
    setFeedback({});
    startTransition(async () => {
      const result = await addCounselingSession(record.id, data);
      setFeedback(result);
      if (result.success) { setSessionOpen(false); setTab("sessions"); }
    });
  }

  function submitReferral(data: FormData) {
    setFeedback({});
    startTransition(async () => {
      const result = await addCaseReferral(record.id, data);
      setFeedback(result);
      if (result.success) { setReferralOpen(false); setTab("referrals"); }
    });
  }

  async function removeSession(id: string) {
    if (!(await confirm({ title: "Hapus catatan pertemuan?", description: "Catatan ini akan dihapus dari timeline kasus.", confirmText: "Hapus", variant: "danger", icon: "trash" }))) return;
    startTransition(async () => setFeedback(await removeCounselingSession(record.id, id)));
  }

  async function removeReferral(id: string) {
    if (!(await confirm({ title: "Hapus rujukan?", description: "Riwayat rujukan ini akan dihapus.", confirmText: "Hapus", variant: "danger", icon: "trash" }))) return;
    startTransition(async () => setFeedback(await removeCaseReferral(record.id, id)));
  }

  function advanceReferral(id: string, currentStatus: string, result: string | null) {
    const next = referralNext[currentStatus];
    if (!next) return;
    startTransition(async () => setFeedback(await changeReferralStatus(record.id, id, next, result ?? "")));
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Link href="/counselor/cases" className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-text dark:text-gray-400"><ArrowLeft className="h-4 w-4" /> Kembali ke daftar kasus</Link>

      <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#6D28D9] to-[#9333EA] p-5 text-white shadow-[0_16px_40px_-20px_rgba(109,40,217,0.55)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">Kasus BK</span>
              <StatusBadge value={record.status} />
              <RiskBadge value={record.riskLevel} />
            </div>
            <h1 className="mt-3 font-heading text-2xl font-bold leading-snug">{record.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/80">{record.description || "Belum ada uraian permasalahan."}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white" asChild><a href={`/counselor/cases/${record.id}/print`} target="_blank" rel="noopener noreferrer"><FileText /> Cetak</a></Button>
            <Button onClick={() => setSessionOpen(true)} className="bg-white text-[#6D28D9] hover:bg-white/90"><MessageSquarePlus /> Catat Pertemuan</Button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 border-t border-white/20 pt-5 sm:grid-cols-2 xl:grid-cols-4">
          <Info icon={UserRound} label="Siswa" value={`${record.student.user.name} · ${record.student.class?.name ?? "Tanpa kelas"}`} />
          <Info icon={Building2} label="Jurusan" value={record.student.major ? `${record.student.major.code} · ${record.student.major.name}` : "–"} />
          <Info icon={MessagesSquare} label="Guru BK" value={record.counselor.user.name} />
          <Info icon={CalendarClock} label="Tindak lanjut" value={record.nextFollowUpAt ? fullDate(record.nextFollowUpAt) : "Belum dijadwalkan"} />
        </div>
      </header>

      {feedback.error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{feedback.error}</p>}
      {feedback.success && <p className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Data kasus berhasil diperbarui.</p>}

      <div className="mt-5 grid grid-cols-3 gap-1.5 rounded-xl border border-[#E8E8EC] bg-white p-1.5 dark:border-white/10 dark:bg-[#19191C]">
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")} label="Asesmen" count={null} />
        <TabButton active={tab === "sessions"} onClick={() => setTab("sessions")} label="Pertemuan" count={record.sessions.length} />
        <TabButton active={tab === "referrals"} onClick={() => setTab("referrals")} label="Rujukan" count={record.referrals.length} />
      </div>

      <div className="mt-5">
        {tab === "overview" && (
          <form action={submitAssessment} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="rounded-xl border border-[#E8E8EC] bg-white p-5 dark:border-white/10 dark:bg-[#19191C]">
              <div className="flex items-start gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"><HeartPulse className="h-4 w-4" /></div><div><h2 className="font-heading font-semibold text-gray-900 dark:text-white">Asesmen risiko</h2><p className="mt-0.5 text-xs text-gray-400">Catat tingkat risiko berdasarkan asesmen profesional Guru BK.</p></div></div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <FormSelect name="riskLevel" label="Tingkat risiko" defaultValue={record.riskLevel}>{Object.entries(riskLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</FormSelect>
                <FormSelect name="priority" label="Prioritas penanganan" defaultValue={record.priority}>{Object.entries(priorityLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</FormSelect>
                <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="riskNotes">Catatan indikator risiko</Label><Textarea id="riskNotes" name="riskNotes" defaultValue={record.riskNotes ?? ""} rows={6} placeholder="Indikator yang ditemukan, faktor pelindung, dan langkah keselamatan yang sudah dilakukan." /></div>
              </div>
            </section>
            <section className="rounded-xl border border-[#E8E8EC] bg-white p-5 dark:border-white/10 dark:bg-[#19191C]">
              <h2 className="font-heading font-semibold text-gray-900 dark:text-white">Status penanganan</h2>
              <div className="mt-4 space-y-4">
                <FormSelect name="status" label="Status kasus" defaultValue={record.status}>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</FormSelect>
                <div className="space-y-1.5"><Label htmlFor="nextFollowUpAt">Tindak lanjut berikutnya</Label><Input id="nextFollowUpAt" name="nextFollowUpAt" type="datetime-local" defaultValue={record.nextFollowUpAt ? dateTimeInput(record.nextFollowUpAt) : ""} /></div>
                <div className="rounded-lg bg-[#FAFAFA] p-3 text-xs text-gray-500 dark:bg-white/[0.03] dark:text-gray-400"><p>{record.sessions.length} pertemuan tercatat</p><p className="mt-1">{record.referrals.length} rujukan tercatat</p><p className="mt-1">Tahun ajaran {record.academicYear.year}</p></div>
                <Button type="submit" disabled={pending} className="w-full bg-brand text-white hover:bg-brand-strong">{pending ? "Menyimpan..." : "Simpan asesmen"}</Button>
              </div>
            </section>
          </form>
        )}

        {tab === "sessions" && (
          <section className="rounded-xl border border-[#E8E8EC] bg-white p-5 dark:border-white/10 dark:bg-[#19191C]">
            <div className="flex items-center justify-between gap-3"><div><h2 className="font-heading font-semibold text-gray-900 dark:text-white">Timeline pertemuan</h2><p className="mt-1 text-xs text-gray-400">Riwayat layanan terbaru ditampilkan paling atas.</p></div><Button onClick={() => setSessionOpen(true)} className="bg-brand text-white hover:bg-brand-strong"><Plus /> Pertemuan</Button></div>
            <div className="mt-5 space-y-4">
              {record.sessions.length === 0 && <Empty icon={MessagesSquare} text="Belum ada catatan pertemuan dalam kasus ini." />}
              {record.sessions.map((session, index) => (
                <article key={session.id} className="relative pl-8">
                  {index < record.sessions.length - 1 && <span className="absolute bottom-[-17px] left-[11px] top-7 w-px bg-[#E8E8EC] dark:bg-white/10" />}
                  <span className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-brand-soft bg-white text-[10px] font-bold text-brand-text dark:border-brand/30 dark:bg-[#19191C]">{record.sessions.length - index}</span>
                  <div className="rounded-lg border border-[#E8E8EC] p-4 dark:border-white/10">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-gray-900 dark:text-white">{modeLabels[session.mode]}</h3>{session.isConfidential && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-white/5">Rahasia</span>}</div><p className="mt-1 text-xs text-gray-400">{fullDate(session.sessionDate)} · {session.durationMinutes} menit · {session.counselor.user.name}</p></div><Button variant="ghost" size="icon-sm" onClick={() => removeSession(session.id)} disabled={pending} className="text-red-500"><Trash2 /></Button></div>
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">{session.summary}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">{session.intervention && <Note label="Intervensi" text={session.intervention} />}{session.outcome && <Note label="Hasil" text={session.outcome} />}{session.nextPlan && <Note label="Rencana lanjut" text={session.nextPlan} />}</div>
                    {(session.location) && <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-400"><MapPin className="h-3.5 w-3.5" /> {session.location}</p>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "referrals" && (
          <section className="rounded-xl border border-[#E8E8EC] bg-white p-5 dark:border-white/10 dark:bg-[#19191C]">
            <div className="flex items-center justify-between gap-3"><div><h2 className="font-heading font-semibold text-gray-900 dark:text-white">Rujukan profesional</h2><p className="mt-1 text-xs text-gray-400">Dokumentasikan koordinasi dengan pihak di luar layanan BK sekolah.</p></div><Button onClick={() => setReferralOpen(true)} className="bg-brand text-white hover:bg-brand-strong"><Plus /> Rujukan</Button></div>
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {record.referrals.length === 0 && <div className="lg:col-span-2"><Empty icon={Building2} text="Belum ada rujukan untuk kasus ini." /></div>}
              {record.referrals.map((referral) => (
                <article key={referral.id} className="rounded-lg border border-[#E8E8EC] p-4 dark:border-white/10">
                  <div className="flex items-start justify-between gap-3"><div><span className="rounded-full bg-purple-50 px-2 py-1 text-[10px] font-semibold text-purple-600 dark:bg-purple-500/10 dark:text-purple-300">{referralLabels[referral.status]}</span><h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{referral.referredTo}</h3><p className="mt-0.5 text-xs text-gray-400">{referral.institution || "Institusi belum dicatat"}</p></div><Button variant="ghost" size="icon-sm" onClick={() => removeReferral(referral.id)} disabled={pending} className="text-red-500"><Trash2 /></Button></div>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{referral.reason}</p>
                  <div className="mt-3 space-y-1 text-xs text-gray-400"><p>{fullDate(referral.referredAt)}</p>{referral.contact && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{referral.contact}</p>}{referral.followUpAt && <p>Tindak lanjut: {fullDate(referral.followUpAt)}</p>}</div>
                  {referralNext[referral.status] && <Button variant="outline" size="sm" className="mt-4" disabled={pending} onClick={() => advanceReferral(referral.id, referral.status, referral.result)}>Lanjut ke: {referralLabels[referralNext[referral.status]]}</Button>}
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      <Dialog open={sessionOpen} onOpenChange={setSessionOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Catat Pertemuan Konseling</DialogTitle></DialogHeader><form action={submitSession} className="grid gap-4 pt-2 sm:grid-cols-2"><FormSelect name="mode" label="Bentuk layanan" defaultValue="INDIVIDUAL">{Object.entries(modeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</FormSelect><div className="space-y-1.5"><Label>Tanggal dan waktu</Label><Input name="sessionDate" type="datetime-local" defaultValue={dateTimeInput()} required /></div><div className="space-y-1.5"><Label>Durasi (menit)</Label><Input name="durationMinutes" type="number" min={5} max={480} defaultValue={45} /></div><div className="space-y-1.5"><Label>Lokasi</Label><Input name="location" placeholder="Ruang BK / daring" /></div><div className="space-y-1.5 sm:col-span-2"><Label>Ringkasan pertemuan *</Label><Textarea name="summary" rows={4} required placeholder="Pokok pembahasan dan observasi penting." /></div><div className="space-y-1.5"><Label>Intervensi</Label><Textarea name="intervention" rows={3} placeholder="Teknik atau layanan yang diberikan." /></div><div className="space-y-1.5"><Label>Hasil sementara</Label><Textarea name="outcome" rows={3} placeholder="Perubahan, kesepakatan, atau respons siswa." /></div><div className="space-y-1.5 sm:col-span-2"><Label>Rencana berikutnya</Label><Textarea name="nextPlan" rows={2} /></div><div className="space-y-1.5"><Label>Jadwal tindak lanjut</Label><Input name="nextFollowUpAt" type="datetime-local" /></div><label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-600 dark:text-gray-300"><input name="isConfidential" type="checkbox" defaultChecked className="h-4 w-4 rounded" /> Catatan rahasia</label><div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={() => setSessionOpen(false)}>Batal</Button><Button type="submit" disabled={pending} className="bg-brand text-white hover:bg-brand-strong">{pending ? "Menyimpan..." : "Simpan pertemuan"}</Button></div></form></DialogContent>
      </Dialog>

      <Dialog open={referralOpen} onOpenChange={setReferralOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Buat Rujukan Kasus</DialogTitle></DialogHeader><form action={submitReferral} className="grid gap-4 pt-2 sm:grid-cols-2"><div className="space-y-1.5"><Label>Dirujuk kepada *</Label><Input name="referredTo" required placeholder="Psikolog / Puskesmas / UPTD PPA" /></div><div className="space-y-1.5"><Label>Institusi</Label><Input name="institution" placeholder="Nama lembaga atau fasilitas" /></div><div className="space-y-1.5"><Label>Kontak</Label><Input name="contact" placeholder="Telepon / email" /></div><div className="space-y-1.5"><Label>Tanggal rujukan</Label><Input name="referredAt" type="datetime-local" defaultValue={dateTimeInput()} /></div><div className="space-y-1.5 sm:col-span-2"><Label>Alasan rujukan *</Label><Textarea name="reason" rows={4} required placeholder="Kebutuhan yang berada di luar kewenangan atau kompetensi layanan BK sekolah." /></div><div className="space-y-1.5 sm:col-span-2"><Label>Jadwal tindak lanjut</Label><Input name="followUpAt" type="datetime-local" /></div><div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={() => setReferralOpen(false)}>Batal</Button><Button type="submit" disabled={pending} className="bg-brand text-white hover:bg-brand-strong">{pending ? "Menyimpan..." : "Simpan rujukan"}</Button></div></form></DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) { return <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600 dark:bg-white/5 dark:text-gray-300">{statusLabels[value] ?? value}</span>; }
function RiskBadge({ value }: { value: string }) { const urgent = value === "HIGH" || value === "CRITICAL"; return <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold", urgent ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300")}>Risiko {riskLabels[value] ?? value}</span>; }
function Info({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) { return <div className="flex items-center gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white"><Icon className="h-4 w-4" /></div><div className="min-w-0"><p className="text-[10px] uppercase tracking-wide text-white/60">{label}</p><p className="mt-0.5 truncate text-xs font-medium text-white/95">{value}</p></div></div>; }
function TabButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number | null }) { return <button type="button" onClick={onClick} className={cn("flex min-h-10 items-center justify-center gap-2 rounded-lg px-2 text-xs font-semibold transition-colors sm:text-sm", active ? "bg-brand-soft text-brand-text dark:bg-brand/10 dark:text-brand-text" : "text-gray-500 hover:bg-[#F7F7F9] dark:text-gray-400 dark:hover:bg-white/5")}>{label}{count !== null && <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] text-gray-500 shadow-sm dark:bg-white/10 dark:text-gray-300">{count}</span>}</button>; }
function FormSelect({ name, label, defaultValue, children }: { name: string; label: string; defaultValue: string; children: React.ReactNode }) { const [value, setValue] = useState(defaultValue); return <div className="space-y-1.5"><Label>{label}</Label><input type="hidden" name={name} value={value} /><Select value={value} onValueChange={setValue}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{children}</SelectContent></Select></div>; }
function Empty({ icon: Icon, text }: { icon: typeof MessagesSquare; text: string }) { return <div className="rounded-lg border border-dashed border-[#DADAE0] px-4 py-10 text-center dark:border-white/10"><Icon className="mx-auto h-7 w-7 text-gray-300 dark:text-gray-600" /><p className="mt-2 text-sm text-gray-400">{text}</p></div>; }
function Note({ label, text }: { label: string; text: string }) { return <div className="rounded-lg bg-[#FAFAFA] p-3 dark:bg-white/[0.03]"><p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p><p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-gray-600 dark:text-gray-300">{text}</p></div>; }
