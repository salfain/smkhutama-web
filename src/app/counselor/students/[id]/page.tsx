import { getStudentBook } from "../../bk-actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Award, MessagesSquare, Home as HomeIcon, Gavel, Scale, Clock, LogOut } from "lucide-react";

import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

const typeLabel: Record<string, string> = { PRIBADI: "Pribadi", SOSIAL: "Sosial", BELAJAR: "Belajar", KARIR: "Karir" };
const fmt = (d: string | Date) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export default async function StudentBookDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getStudentBook(id);
  if (!s) notFound();

  return (
    <div className="p-4 md:p-6 lg:p-8 print:p-0 print:bg-white">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Link href="/counselor/students" className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />Kembali ke Buku Siswa
        </Link>
        <PrintButton />
      </div>

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 p-5 text-white">
        <h1 className="font-heading text-xl font-bold">{s.name}</h1>
        <p className="text-sm text-purple-100">{s.className} · {s.major}{s.nis && ` · NIS: ${s.nis}`}</p>
      </div>

      {/* Poin */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <Stat icon={ShieldAlert} color="bg-red-500" value={s.violationPoints} label="Poin Pelanggaran" />
        <Stat icon={Award} color="bg-emerald-500" value={s.achievementPoints} label="Poin Prestasi" />
        <Stat icon={Scale} color="bg-blue-500" value={s.netPoints} label="Poin Bersih" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Riwayat Konseling" icon={MessagesSquare}>
          {s.cases.length === 0 ? <Empty /> : s.cases.map((c) => (
            <Item key={c.id} title={c.title} sub={`${typeLabel[c.type]} · ${fmt(c.sessionDate)}`} />
          ))}
        </Panel>
        <Panel title="Pelanggaran" icon={ShieldAlert}>
          {s.violations.length === 0 ? <Empty /> : s.violations.map((v) => (
            <Item key={v.id} title={v.typeName ?? v.description} sub={`${fmt(v.date)}`} badge={`${v.points}`} badgeCls="bg-red-100 text-red-700" />
          ))}
        </Panel>
        <Panel title="Prestasi" icon={Award}>
          {s.achievements.length === 0 ? <Empty /> : s.achievements.map((a) => (
            <Item key={a.id} title={a.title} sub={`${a.level || "-"} · ${fmt(a.date)}`} badge={`+${a.points}`} badgeCls="bg-emerald-100 text-emerald-700" />
          ))}
        </Panel>
        <Panel title="Kunjungan Rumah & Surat" icon={HomeIcon}>
          {s.homeVisits.length === 0 && s.summons.length === 0 ? <Empty /> : (
            <>
              {s.homeVisits.map((h) => <Item key={h.id} title={h.purpose} sub={`Kunjungan · ${fmt(h.visitDate)}`} />)}
              {s.summons.map((p) => <Item key={p.id} title={`${p.level} — ${p.reason}`} sub={`Surat · ${fmt(p.createdAt)}`} icon={<Gavel className="h-3.5 w-3.5 text-gray-400" />} />)}
            </>
          )}
        </Panel>

        {/* ── Data Piket (read-only, sinkron dari modul Guru Piket) ── */}
        <Panel title={`Keterlambatan (${s.tardiness.length}x)`} icon={Clock}
          badge={s.tardiness.length > 0 ? { label: `${s.tardiness.length}x`, cls: "bg-amber-100 text-amber-700" } : undefined}>
          {s.tardiness.length === 0 ? <Empty /> : s.tardiness.map((t) => (
            <Item
              key={t.id}
              title={`Tiba ${new Date(t.arrivalTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`}
              sub={`${fmt(t.date)}${t.reason ? ` · ${t.reason}` : ""}${t.sanction ? ` · Sanksi: ${t.sanction}` : ""}`}
              badge={fmt(t.date)}
              badgeCls="bg-amber-50 text-amber-600"
            />
          ))}
        </Panel>

        <Panel title={`Izin Keluar/Masuk (${s.permits.length}x)`} icon={LogOut}
          badge={s.permits.filter((p) => p.status === "KELUAR").length > 0
            ? { label: `${s.permits.filter((p) => p.status === "KELUAR").length} aktif`, cls: "bg-red-100 text-red-700" }
            : undefined}>
          {s.permits.length === 0 ? <Empty /> : s.permits.map((p) => (
            <Item
              key={p.id}
              title={p.reason}
              sub={`${fmt(p.date)} · ${
                p.status === "KELUAR" ? "Belum kembali"
                : p.status === "SUDAH_KEMBALI" ? `Kembali ${p.returnTime ? new Date(p.returnTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}`
                : "Tidak kembali"
              }`}
              badge={p.status === "KELUAR" ? "Keluar" : p.status === "SUDAH_KEMBALI" ? "Kembali" : "Tdk Kembali"}
              badgeCls={
                p.status === "KELUAR" ? "bg-red-100 text-red-700"
                : p.status === "SUDAH_KEMBALI" ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
              }
            />
          ))}
        </Panel>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, color, value, label }: { icon: typeof ShieldAlert; color: string; value: number; label: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${color}`}><Icon className="h-5 w-5 text-white" /></div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
function Panel({ title, icon: Icon, children, badge }: {
  title: string; icon: typeof ShieldAlert; children: React.ReactNode;
  badge?: { label: string; cls: string };
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
      <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
        <Icon className="h-4 w-4 text-gray-400" />{title}
        {badge && (
          <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${badge.cls}`}>{badge.label}</span>
        )}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Item({ title, sub, badge, badgeCls, icon }: { title: string; sub: string; badge?: string; badgeCls?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
      <div className="min-w-0 flex items-center gap-2">
        {icon}
        <div className="min-w-0">
          <p className="truncate text-sm text-gray-800">{title}</p>
          <p className="text-xs text-gray-400">{sub}</p>
        </div>
      </div>
      {badge && <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${badgeCls}`}>{badge}</span>}
    </div>
  );
}
function Empty() { return <p className="text-xs text-gray-400">Belum ada data.</p>; }
