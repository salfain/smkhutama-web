"use client";

import { useMemo, useState, useTransition } from "react";
import {
  BellRing,
  CalendarRange,
  CheckCircle2,
  KeyRound,
  MailPlus,
  Plus,
  ShieldCheck,
  Trash2,
  UserRoundCog,
} from "lucide-react";
import { useConfirm } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ASSIGNMENT_LABELS,
  ASSIGNMENT_OPTIONS,
  type AssignmentKey,
} from "@/lib/access-control";
import { cn } from "@/lib/utils";
import type { getAccessControlData } from "./actions";
import {
  createAssignment,
  deleteAssignment,
  sendInternalNotification,
  setPermissionOverride,
  toggleAssignment,
} from "./actions";

type Data = Awaited<ReturnType<typeof getAccessControlData>>;
type Tab = "assignments" | "permissions" | "notifications";
type ActionResult = { success?: boolean; error?: string };

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  KURIKULUM: "Kurikulum",
  KESISWAAN: "Kesiswaan",
  ADMIN_CBT: "Admin CBT",
  TEACHER: "Guru",
  COUNSELOR: "Guru BK",
  PIKET: "Piket",
  LANDING_ADMIN: "Admin Landing",
};

function semesterLabel(value: string) {
  return value === "GANJIL" ? "Ganjil" : value === "GENAP" ? "Genap" : value;
}

function dateLabel(value: Date | string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export function AccessControlClient({ data }: { data: Data }) {
  const [selectedUserId, setSelectedUserId] = useState(data.users[0]?.id ?? "");
  const [tab, setTab] = useState<Tab>("assignments");
  const selectedUser = useMemo(
    () => data.users.find((user) => user.id === selectedUserId) ?? data.users[0],
    [data.users, selectedUserId],
  );

  if (!selectedUser) {
    return (
      <div className="rounded-xl border border-dashed border-[#DADAE0] bg-white p-10 text-center dark:border-white/10 dark:bg-[#19191C]">
        <UserRoundCog className="mx-auto h-8 w-8 text-[#9C9C9C]" />
        <p className="mt-3 font-medium text-gray-900 dark:text-white">Belum ada pengguna yang dapat dikelola.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">
      <aside className="self-start rounded-xl border border-[#E8E8EC] bg-white p-3 dark:border-white/10 dark:bg-[#19191C] xl:sticky xl:top-6">
        <div className="px-2 pb-3 pt-1">
          <Label htmlFor="access-user">Pilih pengguna</Label>
          <Select value={selectedUser.id} onValueChange={setSelectedUserId}>
            <SelectTrigger id="access-user" className="mt-2 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {data.users.map((user) => (
                <SelectItem key={user.id} value={user.id}>{user.name} · {roleLabels[user.role] ?? user.role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border border-[#E8E8EC] bg-[#FAFAFA] p-3 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-text dark:bg-brand/10 dark:text-brand-text">
              {selectedUser.name.split(" ").filter(Boolean).map((item) => item[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{selectedUser.name}</p>
              <p className="truncate text-xs text-gray-400">@{selectedUser.username}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-brand-soft px-2 py-1 text-[10px] font-semibold text-brand-text dark:bg-brand/10 dark:text-brand-text">{roleLabels[selectedUser.role] ?? selectedUser.role}</span>
            <span className={cn("rounded-full px-2 py-1 text-[10px] font-semibold", selectedUser.isActive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-gray-100 text-gray-500 dark:bg-white/5")}>{selectedUser.isActive ? "Aktif" : "Nonaktif"}</span>
          </div>
        </div>

        <nav className="mt-3 space-y-1" aria-label="Pengaturan akses">
          <TabButton active={tab === "assignments"} onClick={() => setTab("assignments")} icon={UserRoundCog} label="Penugasan" count={selectedUser.assignments.filter((item) => item.isActive).length} />
          <TabButton active={tab === "permissions"} onClick={() => setTab("permissions")} icon={KeyRound} label="Izin khusus" count={selectedUser.permissionOverrides.length} />
          <TabButton active={tab === "notifications"} onClick={() => setTab("notifications")} icon={BellRing} label="Kirim notifikasi" />
        </nav>
      </aside>

      <main className="min-w-0">
        {tab === "assignments" && <AssignmentsPanel key={selectedUser.id} data={data} user={selectedUser} />}
        {tab === "permissions" && <PermissionsPanel key={selectedUser.id} permissions={data.permissions} user={selectedUser} />}
        {tab === "notifications" && <NotificationPanel key={selectedUser.id} user={selectedUser} />}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, count }: { active: boolean; onClick: () => void; icon: typeof UserRoundCog; label: string; count?: number }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors", active ? "bg-brand text-white" : "text-gray-600 hover:bg-[#F5F5F7] dark:text-gray-300 dark:hover:bg-white/5")}>
      <Icon className="h-4 w-4" />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className={cn("rounded-full px-2 py-0.5 text-[10px]", active ? "bg-white/15 text-white" : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400")}>{count}</span>}
    </button>
  );
}

function AssignmentsPanel({ data, user }: { data: Data; user: Data["users"][number] }) {
  const activeYear = data.academicYears.find((year) => year.isActive) ?? data.academicYears[0];
  const [type, setType] = useState<AssignmentKey>("COUNSELOR");
  const [academicYearId, setAcademicYearId] = useState(activeYear?.id ?? "none");
  const [classId, setClassId] = useState("none");
  const [majorId, setMajorId] = useState("none");
  const [feedback, setFeedback] = useState<ActionResult>({});
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function submit(formData: FormData) {
    formData.set("userId", user.id);
    formData.set("type", type);
    formData.set("academicYearId", academicYearId === "none" ? "" : academicYearId);
    formData.set("classId", classId === "none" ? "" : classId);
    formData.set("majorId", majorId === "none" ? "" : majorId);
    setFeedback({});
    startTransition(async () => setFeedback(await createAssignment(formData)));
  }

  function toggle(id: string) {
    setFeedback({});
    startTransition(async () => setFeedback(await toggleAssignment(id)));
  }

  async function remove(id: string, label: string) {
    const approved = await confirm({ title: "Hapus penugasan?", description: `Penugasan ${label} untuk ${user.name} akan dihapus.`, confirmText: "Hapus", variant: "danger", icon: "trash" });
    if (!approved) return;
    setFeedback({});
    startTransition(async () => setFeedback(await deleteAssignment(id)));
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#E8E8EC] bg-white p-5 dark:border-white/10 dark:bg-[#19191C]">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand-text dark:bg-brand/10 dark:text-brand-text"><Plus className="h-4 w-4" /></div>
          <div><h2 className="font-heading font-semibold text-gray-900 dark:text-white">Tambah penugasan</h2><p className="mt-0.5 text-xs text-gray-400">Satu akun dapat memegang beberapa tanggung jawab sekaligus.</p></div>
        </div>
        <form action={submit} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SelectField label="Jenis penugasan" value={type} onChange={(value) => setType(value as AssignmentKey)}>
            {ASSIGNMENT_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectField>
          <SelectField label="Tahun ajaran" value={academicYearId} onChange={setAcademicYearId}>
            <SelectItem value="none">Tidak dibatasi</SelectItem>
            {data.academicYears.map((year) => <SelectItem key={year.id} value={year.id}>{year.year} · {semesterLabel(year.semester)}{year.isActive ? " · Aktif" : ""}</SelectItem>)}
          </SelectField>
          <SelectField label="Kelas terkait" value={classId} onChange={setClassId}>
            <SelectItem value="none">Tidak ada</SelectItem>
            {data.classes.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
          </SelectField>
          <SelectField label="Jurusan terkait" value={majorId} onChange={setMajorId}>
            <SelectItem value="none">Tidak ada</SelectItem>
            {data.majors.map((item) => <SelectItem key={item.id} value={item.id}>{item.code} · {item.name}</SelectItem>)}
          </SelectField>
          <div className="space-y-1.5"><Label htmlFor="assignment-start">Mulai berlaku</Label><Input id="assignment-start" name="startDate" type="date" /></div>
          <div className="space-y-1.5"><Label htmlFor="assignment-end">Selesai berlaku</Label><Input id="assignment-end" name="endDate" type="date" /></div>
          <div className="space-y-1.5 md:col-span-2 xl:col-span-3"><Label htmlFor="assignment-note">Catatan</Label><Textarea id="assignment-note" name="note" rows={2} placeholder="Contoh: Koordinator kelas X atau pengganti sementara" /></div>
          {feedback.error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 md:col-span-2 xl:col-span-3 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{feedback.error}</p>}
          {feedback.success && <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 md:col-span-2 xl:col-span-3 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Perubahan berhasil disimpan.</p>}
          <div className="md:col-span-2 xl:col-span-3"><Button type="submit" disabled={pending} className="bg-brand text-white hover:bg-brand-strong"><Plus className="h-4 w-4" />{pending ? "Menyimpan..." : "Tambahkan penugasan"}</Button></div>
        </form>
      </section>

      <section className="rounded-xl border border-[#E8E8EC] bg-white p-5 dark:border-white/10 dark:bg-[#19191C]">
        <h2 className="font-heading font-semibold text-gray-900 dark:text-white">Riwayat penugasan</h2>
        <p className="mt-1 text-xs text-gray-400">Penugasan nonaktif tetap disimpan untuk jejak tanggung jawab.</p>
        <div className="mt-4 space-y-3">
          {user.assignments.length === 0 && <EmptyState icon={CalendarRange} text="Belum ada penugasan tambahan." />}
          {user.assignments.map((assignment) => {
            const start = dateLabel(assignment.startDate);
            const end = dateLabel(assignment.endDate);
            return (
              <article key={assignment.id} className={cn("rounded-lg border p-4", assignment.isActive ? "border-[#E8E8EC] dark:border-white/10" : "border-dashed border-gray-200 opacity-65 dark:border-white/10")}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-gray-900 dark:text-white">{ASSIGNMENT_LABELS[assignment.type]}</h3><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", assignment.isActive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-gray-100 text-gray-500 dark:bg-white/5")}>{assignment.isActive ? "Aktif" : "Nonaktif"}</span></div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      {assignment.academicYear && <span>{assignment.academicYear.year} · {semesterLabel(assignment.academicYear.semester)}</span>}
                      {assignment.class && <span>Kelas {assignment.class.name}</span>}
                      {assignment.major && <span>{assignment.major.code} · {assignment.major.name}</span>}
                      {(start || end) && <span>{start ?? "Sekarang"} – {end ?? "seterusnya"}</span>}
                    </div>
                    {assignment.note && <p className="mt-2 text-xs text-gray-400">{assignment.note}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => toggle(assignment.id)}>{assignment.isActive ? "Nonaktifkan" : "Aktifkan"}</Button>
                    <Button type="button" size="icon-sm" variant="destructive" disabled={pending} onClick={() => remove(assignment.id, ASSIGNMENT_LABELS[assignment.type])} title="Hapus"><Trash2 /></Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function PermissionsPanel({ permissions, user }: { permissions: Data["permissions"]; user: Data["users"][number] }) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<ActionResult>({});
  const groups = useMemo(() => {
    const result = new Map<string, typeof permissions>();
    for (const permission of permissions) {
      const items = result.get(permission.category) ?? [];
      result.set(permission.category, [...items, permission]);
    }
    return result;
  }, [permissions]);

  function stateFor(permissionId: string) {
    const item = user.permissionOverrides.find((override) => override.permissionId === permissionId);
    return item ? (item.allowed ? "ALLOW" : "DENY") : "DEFAULT";
  }

  function change(permissionKey: string, state: string) {
    setFeedback({});
    startTransition(async () => setFeedback(await setPermissionOverride(user.id, permissionKey, state as "DEFAULT" | "ALLOW" | "DENY")));
  }

  return (
    <section className="rounded-xl border border-[#E8E8EC] bg-white p-5 dark:border-white/10 dark:bg-[#19191C]">
      <div className="flex items-start gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand-text dark:bg-brand/10 dark:text-brand-text"><ShieldCheck className="h-4 w-4" /></div><div><h2 className="font-heading font-semibold text-gray-900 dark:text-white">Izin khusus pengguna</h2><p className="mt-0.5 text-xs text-gray-400">Default mengikuti role dan penugasan. Override hanya untuk pengecualian yang terkontrol.</p></div></div>
      {feedback.error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{feedback.error}</p>}
      {feedback.success && <p className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Izin berhasil diperbarui.</p>}
      <div className="mt-5 space-y-5">
        {[...groups.entries()].map(([category, items]) => (
          <div key={category}>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">{category}</p>
            <div className="overflow-hidden rounded-lg border border-[#E8E8EC] dark:border-white/10">
              {items.map((permission, index) => (
                <div key={permission.id} className={cn("grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center", index > 0 && "border-t border-[#E8E8EC] dark:border-white/10")}>
                  <div><p className="text-sm font-medium text-gray-900 dark:text-white">{permission.name}</p><p className="mt-0.5 text-xs text-gray-400">{permission.description ?? permission.key}</p></div>
                  <Select value={stateFor(permission.id)} disabled={pending} onValueChange={(state) => change(permission.key, state)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="DEFAULT">Default sistem</SelectItem><SelectItem value="ALLOW">Izinkan khusus</SelectItem><SelectItem value="DENY">Tolak khusus</SelectItem></SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function NotificationPanel({ user }: { user: Data["users"][number] }) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<ActionResult>({});
  const [notificationType, setNotificationType] = useState("INFO");

  function submit(formData: FormData) {
    formData.set("userId", user.id);
    formData.set("notificationType", notificationType);
    setFeedback({});
    startTransition(async () => setFeedback(await sendInternalNotification(formData)));
  }

  return (
    <section className="rounded-xl border border-[#E8E8EC] bg-white p-5 dark:border-white/10 dark:bg-[#19191C]">
      <div className="flex items-start gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand-text dark:bg-brand/10 dark:text-brand-text"><MailPlus className="h-4 w-4" /></div><div><h2 className="font-heading font-semibold text-gray-900 dark:text-white">Kirim notifikasi internal</h2><p className="mt-0.5 text-xs text-gray-400">Pesan akan tampil di pusat notifikasi dashboard {user.name}.</p></div></div>
      <form action={submit} className="mt-5 max-w-2xl space-y-4">
        <div className="space-y-1.5"><Label htmlFor="notification-title">Judul</Label><Input id="notification-title" name="title" placeholder="Contoh: Jadwal piket diperbarui" required /></div>
        <div className="space-y-1.5"><Label htmlFor="notification-message">Pesan</Label><Textarea id="notification-message" name="message" rows={4} placeholder="Tuliskan informasi atau tindak lanjut yang diperlukan." required /></div>
        <SelectField label="Jenis notifikasi" value={notificationType} onChange={setNotificationType}><SelectItem value="INFO">Informasi</SelectItem><SelectItem value="SUCCESS">Berhasil</SelectItem><SelectItem value="WARNING">Peringatan</SelectItem><SelectItem value="ACTION_REQUIRED">Perlu tindakan</SelectItem></SelectField>
        <div className="space-y-1.5"><Label htmlFor="notification-href">Tautan tujuan (opsional)</Label><Input id="notification-href" name="href" placeholder="Contoh: /counselor/requests" /></div>
        {feedback.error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{feedback.error}</p>}
        {feedback.success && <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Notifikasi berhasil dikirim.</p>}
        <Button type="submit" disabled={pending} className="bg-brand text-white hover:bg-brand-strong"><BellRing className="h-4 w-4" />{pending ? "Mengirim..." : "Kirim notifikasi"}</Button>
      </form>
    </section>
  );
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{children}</SelectContent></Select></div>;
}

function EmptyState({ icon: Icon, text }: { icon: typeof CalendarRange; text: string }) {
  return <div className="rounded-lg border border-dashed border-[#DADAE0] px-4 py-8 text-center dark:border-white/10"><Icon className="mx-auto h-6 w-6 text-gray-300 dark:text-gray-600" /><p className="mt-2 text-sm text-gray-400">{text}</p></div>;
}
