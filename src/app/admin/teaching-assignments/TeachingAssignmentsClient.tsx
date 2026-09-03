"use client";

import { useMemo, useState, useTransition } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { useConfirm } from "@/components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createTeachingAssignment,
  deleteTeachingAssignment,
  toggleTeachingAssignment,
  updateTeachingAssignment,
} from "./actions";

type AcademicYear = {
  id: string;
  year: string;
  semester: "GANJIL" | "GENAP";
  isActive: boolean;
};

type Teacher = { id: string; user: { name: string } };
type Subject = { id: string; name: string; code: string; majorId: string | null };
type ClassOption = { id: string; name: string; grade: string; majorId: string; major: { code: string } };

type Assignment = {
  id: string;
  academicYearId: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  weeklyPeriods: number;
  note: string | null;
  isActive: boolean;
  academicYear: { year: string; semester: "GANJIL" | "GENAP"; isActive: boolean };
  teacher: { user: { name: string } };
  subject: { name: string; code: string };
  class: { name: string; grade: string; major: { code: string } };
};

export function TeachingAssignmentsClient({
  assignments,
  academicYears,
  teachers,
  subjects,
  classes,
}: {
  assignments: Assignment[];
  academicYears: AcademicYear[];
  teachers: Teacher[];
  subjects: Subject[];
  classes: ClassOption[];
}) {
  const defaultYearId = academicYears.find((item) => item.isActive)?.id ?? academicYears[0]?.id ?? "";
  const [yearFilter, setYearFilter] = useState(defaultYearId);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [academicYearId, setAcademicYearId] = useState(defaultYearId);
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classId, setClassId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  const yearAssignments = useMemo(
    () => assignments.filter((item) => item.academicYearId === yearFilter),
    [assignments, yearFilter],
  );
  const filteredAssignments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return yearAssignments;
    return yearAssignments.filter((item) =>
      `${item.teacher.user.name} ${item.subject.code} ${item.subject.name} ${item.class.name} ${item.class.major.code}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, yearAssignments]);
  const activeAssignments = yearAssignments.filter((item) => item.isActive);
  const totalPeriods = activeAssignments.reduce((total, item) => total + item.weeklyPeriods, 0);
  const activeTeacherCount = new Set(activeAssignments.map((item) => item.teacherId)).size;
  const coveredClassCount = new Set(activeAssignments.map((item) => item.classId)).size;
  const selectedClass = classes.find((item) => item.id === classId);
  const availableSubjects = subjects.filter(
    (item) => !item.majorId || !selectedClass || item.majorId === selectedClass.majorId,
  );
  const prerequisitesReady = academicYears.length > 0 && teachers.length > 0 && subjects.length > 0 && classes.length > 0;

  const teacherLoads = useMemo(() => {
    const loads = new Map<string, { id: string; name: string; periods: number; classes: Set<string> }>();
    for (const item of activeAssignments) {
      const current = loads.get(item.teacherId) ?? {
        id: item.teacherId,
        name: item.teacher.user.name,
        periods: 0,
        classes: new Set<string>(),
      };
      current.periods += item.weeklyPeriods;
      current.classes.add(item.classId);
      loads.set(item.teacherId, current);
    }
    return Array.from(loads.values()).sort((a, b) => b.periods - a.periods || a.name.localeCompare(b.name));
  }, [activeAssignments]);

  function openCreate() {
    setEditing(null);
    setAcademicYearId(yearFilter || defaultYearId);
    setTeacherId("");
    setSubjectId("");
    setClassId("");
    setIsActive(true);
    setError("");
    setOpen(true);
  }

  function openEdit(item: Assignment) {
    setEditing(item);
    setAcademicYearId(item.academicYearId);
    setTeacherId(item.teacherId);
    setSubjectId(item.subjectId);
    setClassId(item.classId);
    setIsActive(item.isActive);
    setError("");
    setOpen(true);
  }

  function changeClass(value: string) {
    setClassId(value);
    const nextClass = classes.find((item) => item.id === value);
    const currentSubject = subjects.find((item) => item.id === subjectId);
    if (currentSubject?.majorId && nextClass && currentSubject.majorId !== nextClass.majorId) setSubjectId("");
  }

  function submit(formData: FormData) {
    setError("");
    formData.set("academicYearId", academicYearId);
    formData.set("teacherId", teacherId);
    formData.set("subjectId", subjectId);
    formData.set("classId", classId);
    formData.set("isActive", String(isActive));
    startTransition(async () => {
      const result = editing
        ? await updateTeachingAssignment(editing.id, formData)
        : await createTeachingAssignment(formData);
      if ("error" in result) setError(result.error);
      else setOpen(false);
    });
  }

  async function remove(item: Assignment) {
    const approved = await confirm({
      title: "Hapus pembagian mengajar?",
      description: `${item.teacher.user.name} · ${item.subject.code} · ${item.class.name} akan dihapus.`,
      confirmText: "Hapus",
      cancelText: "Batal",
      variant: "danger",
      icon: "trash",
    });
    if (!approved) return;
    startTransition(async () => {
      const result = await deleteTeachingAssignment(item.id);
      if (result.error) alert(result.error);
    });
  }

  function toggle(item: Assignment) {
    startTransition(async () => {
      const result = await toggleTeachingAssignment(item.id);
      if (result.error) alert(result.error);
    });
  }

  return (
    <>
      {!prerequisitesReady && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          Lengkapi tahun ajaran, data guru, mata pelajaran, dan kelas sebelum membuat pembagian mengajar.
        </div>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={UserRoundCheck} label="Guru ditugaskan" value={String(activeTeacherCount)} />
        <Metric icon={UsersRound} label="Kelas terlayani" value={`${coveredClassCount}/${classes.length}`} />
        <Metric icon={Clock3} label="Total alokasi" value={`${totalPeriods} JP`} />
        <Metric icon={CheckCircle2} label="Penugasan aktif" value={String(activeAssignments.length)} />
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-[#E8E8EC] bg-white p-4 dark:border-white/10 dark:bg-[#19191C] lg:flex-row lg:items-end">
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
          <Field label="Tahun ajaran">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Pilih tahun ajaran" /></SelectTrigger>
              <SelectContent>
                {academicYears.map((item) => <SelectItem key={item.id} value={item.id}>{yearLabel(item)}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Cari penugasan">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full pl-9" placeholder="Guru, mapel, atau kelas" />
            </div>
          </Field>
        </div>
        <Button onClick={openCreate} disabled={!prerequisitesReady} className="gap-2 bg-brand text-white hover:bg-brand-strong">
          <Plus className="h-4 w-4" /> Tambah Penugasan
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 overflow-hidden rounded-xl border border-[#E8E8EC] bg-white dark:border-white/10 dark:bg-[#19191C]">
          <div className="border-b border-[#E8E8EC] px-4 py-3 dark:border-white/10">
            <h2 className="font-heading text-sm font-semibold text-gray-900 dark:text-white">Daftar pembagian mengajar</h2>
            <p className="mt-0.5 text-xs text-gray-400">{filteredAssignments.length} penugasan ditemukan</p>
          </div>
          {filteredAssignments.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <BookOpen className="mx-auto h-7 w-7 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-300">Belum ada pembagian mengajar</p>
              <p className="mt-1 text-xs text-gray-400">Tambahkan penugasan sebagai dasar jadwal pelajaran.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-[#E8E8EC] dark:divide-white/10 md:hidden">
                {filteredAssignments.map((item) => (
                  <AssignmentCard key={item.id} item={item} pending={pending} onEdit={openEdit} onToggle={toggle} onDelete={remove} />
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-[#F7F7F9] text-[11px] uppercase tracking-wide text-gray-500 dark:bg-white/[0.04] dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Guru</th>
                      <th className="px-4 py-3 font-semibold">Mata pelajaran</th>
                      <th className="px-4 py-3 font-semibold">Kelas</th>
                      <th className="px-4 py-3 text-center font-semibold">Alokasi</th>
                      <th className="px-4 py-3 text-center font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E8EC] dark:divide-white/10">
                    {filteredAssignments.map((item) => (
                      <tr key={item.id} className="text-gray-700 hover:bg-[#FAFAFA] dark:text-gray-200 dark:hover:bg-white/[0.03]">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.teacher.user.name}</td>
                        <td className="px-4 py-3"><span className="font-mono text-xs font-semibold text-brand-text">{item.subject.code}</span><span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{item.subject.name}</span></td>
                        <td className="px-4 py-3"><span className="font-medium">{item.class.name}</span><span className="ml-2 text-xs text-gray-400">{item.class.major.code}</span></td>
                        <td className="px-4 py-3 text-center font-semibold">{item.weeklyPeriods} JP</td>
                        <td className="px-4 py-3 text-center"><StatusBadge active={item.isActive} /></td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon-sm" title={item.isActive ? "Nonaktifkan" : "Aktifkan"} onClick={() => toggle(item)} disabled={pending}><CheckCircle2 className={`h-4 w-4 ${item.isActive ? "text-emerald-500" : "text-gray-400"}`} /></Button>
                            <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => openEdit(item)} disabled={pending}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon-sm" title="Hapus" className="text-red-500 hover:text-red-600" onClick={() => remove(item)} disabled={pending}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <aside className="h-fit rounded-xl border border-[#E8E8EC] bg-white dark:border-white/10 dark:bg-[#19191C]">
          <div className="border-b border-[#E8E8EC] px-4 py-3 dark:border-white/10">
            <h2 className="font-heading text-sm font-semibold text-gray-900 dark:text-white">Beban mengajar</h2>
            <p className="mt-0.5 text-xs text-gray-400">Akumulasi penugasan aktif</p>
          </div>
          <div className="divide-y divide-[#E8E8EC] dark:divide-white/10">
            {teacherLoads.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-gray-400">Belum ada beban mengajar.</p>
            ) : teacherLoads.map((teacher) => (
              <div key={teacher.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-text dark:bg-brand/10">{initials(teacher.name)}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-gray-900 dark:text-white">{teacher.name}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">{teacher.classes.size} kelas</p>
                </div>
                <LoadBadge periods={teacher.periods} />
              </div>
            ))}
          </div>
          <p className="border-t border-[#E8E8EC] px-4 py-3 text-[11px] leading-4 text-gray-400 dark:border-white/10">
            Indikator 24 JP hanya membantu pemantauan awal. Kurikulum tetap menyesuaikan tugas tambahan dan kebijakan sekolah.
          </p>
        </aside>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Pembagian Mengajar" : "Tambah Pembagian Mengajar"}</DialogTitle></DialogHeader>
          <form key={editing?.id ?? "new"} action={submit} className="grid gap-4 pt-2 sm:grid-cols-2">
            <SelectField label="Tahun ajaran *" value={academicYearId} onChange={setAcademicYearId} placeholder="Pilih tahun ajaran">
              {academicYears.map((item) => <SelectItem key={item.id} value={item.id}>{yearLabel(item)}</SelectItem>)}
            </SelectField>
            <SelectField label="Guru pengajar *" value={teacherId} onChange={setTeacherId} placeholder="Pilih guru">
              {teachers.map((item) => <SelectItem key={item.id} value={item.id}>{item.user.name}</SelectItem>)}
            </SelectField>
            <SelectField label="Kelas *" value={classId} onChange={changeClass} placeholder="Pilih kelas">
              {classes.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} · {item.major.code}</SelectItem>)}
            </SelectField>
            <SelectField label="Mata pelajaran *" value={subjectId} onChange={setSubjectId} placeholder="Pilih mata pelajaran">
              {availableSubjects.map((item) => <SelectItem key={item.id} value={item.id}>{item.code} · {item.name}</SelectItem>)}
            </SelectField>
            <Field label="Alokasi per minggu *">
              <div className="relative"><Input name="weeklyPeriods" type="number" min={1} max={48} defaultValue={editing?.weeklyPeriods ?? 2} className="pr-12" required /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">JP</span></div>
            </Field>
            <Field label="Status">
              <Select value={isActive ? "active" : "inactive"} onValueChange={(value) => setIsActive(value === "active")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Aktif</SelectItem><SelectItem value="inactive">Nonaktif</SelectItem></SelectContent>
              </Select>
            </Field>
            <Field label="Catatan">
              <Input name="note" defaultValue={editing?.note ?? ""} placeholder="Opsional, mis. tugas tambahan" />
            </Field>
            <div className="rounded-lg border border-brand-soft bg-brand-soft px-3 py-2 text-xs leading-5 text-gray-600 dark:border-brand/20 dark:bg-brand/[0.07] dark:text-gray-300">
              Pembagian ini akan menjadi acuan kombinasi guru, mapel, dan kelas pada Jadwal Pelajaran.
            </div>
            {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 sm:col-span-2">{error}</p>}
            <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={pending} className="bg-brand text-white hover:bg-brand-strong">{pending ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Penugasan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AssignmentCard({ item, pending, onEdit, onToggle, onDelete }: { item: Assignment; pending: boolean; onEdit: (item: Assignment) => void; onToggle: (item: Assignment) => void; onDelete: (item: Assignment) => void }) {
  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{item.teacher.user.name}</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.subject.code} · {item.subject.name}</p></div>
        <StatusBadge active={item.isActive} />
      </div>
      <div className="mt-3 flex items-center justify-between rounded-lg bg-[#F7F7F9] px-3 py-2 text-xs dark:bg-white/[0.04]"><span>{item.class.name} · {item.class.major.code}</span><strong>{item.weeklyPeriods} JP</strong></div>
      {item.note && <p className="mt-2 truncate text-xs text-gray-400">{item.note}</p>}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Button size="sm" variant="outline" onClick={() => onToggle(item)} disabled={pending}>{item.isActive ? "Nonaktifkan" : "Aktifkan"}</Button>
        <Button size="sm" variant="outline" className="gap-1" onClick={() => onEdit(item)} disabled={pending}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
        <Button size="sm" variant="outline" className="gap-1 border-red-200 text-red-500" onClick={() => onDelete(item)} disabled={pending}><Trash2 className="h-3.5 w-3.5" /> Hapus</Button>
      </div>
    </article>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-[#E8E8EC] bg-white p-4 dark:border-white/10 dark:bg-[#19191C]"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F7F7F9] text-brand-text dark:bg-white/[0.05]"><Icon className="h-4 w-4" /></div><div><p className="text-xs text-gray-400">{label}</p><p className="mt-0.5 font-heading text-base font-semibold text-gray-900 dark:text-white">{value}</p></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function SelectField({ label, value, onChange, placeholder, children }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; children: React.ReactNode }) {
  return <Field label={label}><Select value={value} onValueChange={onChange}><SelectTrigger className="w-full"><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{children}</SelectContent></Select></Field>;
}

function StatusBadge({ active }: { active: boolean }) {
  return <Badge className={active ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300" : "border-gray-200 bg-gray-50 text-gray-500 shadow-none dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-400"}>{active ? "Aktif" : "Nonaktif"}</Badge>;
}

function LoadBadge({ periods }: { periods: number }) {
  const style = periods > 40 ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300" : periods >= 24 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
  return <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${style}`}>{periods} JP</span>;
}

function yearLabel(item: AcademicYear) {
  return `${item.year} · ${item.semester === "GANJIL" ? "Ganjil" : "Genap"}${item.isActive ? " · Aktif" : ""}`;
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}
