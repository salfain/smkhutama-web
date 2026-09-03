"use client";

import { useMemo, useState, useTransition } from "react";
import {
  BookOpen,
  CalendarRange,
  Clock3,
  FileSpreadsheet,
  LayoutGrid,
  Plus,
  Printer,
  Rows3,
  UsersRound,
} from "lucide-react";
import { useConfirm } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  AllClassesScheduleView,
  ClassScheduleView,
  filterScheduleClasses,
  getTimeSlots,
  PrintableAllClassesSchedule,
} from "./ScheduleViews";
import { createLessonSchedule, deleteLessonSchedule, updateLessonSchedule } from "./actions";
import {
  AcademicYear,
  ClassOption,
  DAY_NAMES,
  Schedule,
  SubjectOption,
  TeachingAssignmentOption,
  TeacherOption,
  yearLabel,
} from "./types";

type ViewMode = "class" | "all";

export function LessonScheduleClient({
  schedules,
  academicYears,
  classes,
  subjects,
  teachers,
  teachingAssignments,
}: {
  schedules: Schedule[];
  academicYears: AcademicYear[];
  classes: ClassOption[];
  subjects: SubjectOption[];
  teachers: TeacherOption[];
  teachingAssignments: TeachingAssignmentOption[];
}) {
  const activeYearId = academicYears.find((year) => year.isActive)?.id ?? academicYears[0]?.id ?? "";
  const [view, setView] = useState<ViewMode>("class");
  const [yearFilter, setYearFilter] = useState(activeYearId);
  const [classFilter, setClassFilter] = useState(classes[0]?.id ?? "");
  const [selectedDay, setSelectedDay] = useState(1);
  const [gradeFilter, setGradeFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [academicYearId, setAcademicYearId] = useState(activeYearId);
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [exporting, setExporting] = useState(false);
  const confirm = useConfirm();

  const selectedYear = academicYears.find((year) => year.id === yearFilter);
  const selectedYearSchedules = useMemo(
    () => schedules.filter((schedule) => schedule.academicYearId === yearFilter),
    [schedules, yearFilter],
  );
  const selectedClass = classes.find((item) => item.id === classFilter);
  const selectedClassSchedules = useMemo(
    () => selectedYearSchedules.filter((schedule) => schedule.classId === classFilter),
    [selectedYearSchedules, classFilter],
  );
  const outputClasses = useMemo(
    () => filterScheduleClasses(classes, selectedYearSchedules, gradeFilter, query),
    [classes, selectedYearSchedules, gradeFilter, query],
  );
  const uniqueTeachers = new Set(selectedClassSchedules.map((schedule) => schedule.teacherId)).size;
  const activeDays = new Set(selectedClassSchedules.map((schedule) => schedule.dayOfWeek)).size;
  const prerequisitesReady = academicYears.length > 0 && classes.length > 0 && subjects.length > 0 && teachers.length > 0;
  const applicableAssignments = teachingAssignments.filter(
    (item) => item.academicYearId === academicYearId && item.classId === classId,
  );
  const availableSubjects = applicableAssignments.length > 0
    ? subjects.filter((subject) => applicableAssignments.some((item) => item.subjectId === subject.id))
    : subjects;
  const availableTeachers = applicableAssignments.length > 0
    ? teachers.filter((teacher) => applicableAssignments.some(
      (item) => item.teacherId === teacher.id && (!subjectId || item.subjectId === subjectId),
    ))
    : teachers;

  function openCreate(day?: number, targetClassId?: string) {
    setEditing(null);
    setAcademicYearId(yearFilter || activeYearId);
    setClassId(targetClassId ?? classFilter ?? "");
    setSubjectId("");
    setTeacherId("");
    setDayOfWeek(day ? String(day) : "");
    setError("");
    setOpen(true);
  }

  function changeClass(value: string) {
    setClassId(value);
    setSubjectId("");
    setTeacherId("");
  }

  function changeAcademicYear(value: string) {
    setAcademicYearId(value);
    setSubjectId("");
    setTeacherId("");
  }

  function changeSubject(value: string) {
    setSubjectId(value);
    const validTeacher = teachingAssignments.some(
      (item) => item.academicYearId === academicYearId
        && item.classId === classId
        && item.subjectId === value
        && item.teacherId === teacherId,
    );
    if (applicableAssignments.length > 0 && !validTeacher) setTeacherId("");
  }

  function openEdit(schedule: Schedule) {
    setEditing(schedule);
    setAcademicYearId(schedule.academicYearId);
    setClassId(schedule.classId);
    setSubjectId(schedule.subjectId);
    setTeacherId(schedule.teacherId);
    setDayOfWeek(String(schedule.dayOfWeek));
    setError("");
    setOpen(true);
  }

  function handleSubmit(formData: FormData) {
    setError("");
    formData.set("academicYearId", academicYearId);
    formData.set("classId", classId);
    formData.set("subjectId", subjectId);
    formData.set("teacherId", teacherId);
    formData.set("dayOfWeek", dayOfWeek);
    startTransition(async () => {
      const result = editing ? await updateLessonSchedule(editing.id, formData) : await createLessonSchedule(formData);
      if ("error" in result) setError(result.error);
      else setOpen(false);
    });
  }

  async function handleDelete(schedule: Schedule) {
    const approved = await confirm({
      title: "Hapus jadwal?",
      description: `${schedule.subject.name} untuk ${schedule.class.name}, ${DAY_NAMES[schedule.dayOfWeek]} ${schedule.startTime}–${schedule.endTime} akan dihapus.`,
      confirmText: "Hapus Jadwal",
      cancelText: "Batal",
      variant: "danger",
      icon: "trash",
    });
    if (!approved) return;
    startTransition(async () => {
      const result = await deleteLessonSchedule(schedule.id);
      if (result.error) alert(result.error);
    });
  }

  async function exportExcel() {
    if (!selectedYear || outputClasses.length === 0) return;
    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.utils.book_new();
      for (let day = 1; day <= 6; day += 1) {
        const daySchedules = selectedYearSchedules.filter(
          (schedule) => schedule.dayOfWeek === day && outputClasses.some((item) => item.id === schedule.classId),
        );
        const slots = getTimeSlots(daySchedules);
        const rows = [
          ["Jam", ...outputClasses.map((item) => item.name)],
          ...slots.map((slot) => [
            `${slot.startTime}-${slot.endTime}`,
            ...outputClasses.map((item) => {
              const schedule = daySchedules.find((entry) => entry.classId === item.id && entry.startTime === slot.startTime && entry.endTime === slot.endTime);
              return schedule ? `${schedule.subject.code} - ${schedule.subject.name}\n${schedule.teacher.user.name}${schedule.room ? `\n${schedule.room}` : ""}` : "";
            }),
          ]),
        ];
        const sheet = XLSX.utils.aoa_to_sheet(rows);
        sheet["!cols"] = [{ wch: 16 }, ...outputClasses.map(() => ({ wch: 24 }))];
        XLSX.utils.book_append_sheet(workbook, sheet, DAY_NAMES[day]);
      }
      const safeYear = selectedYear.year.replace(/[^a-zA-Z0-9-]/g, "-");
      XLSX.writeFile(workbook, `jadwal-pelajaran-${safeYear}-${selectedYear.semester.toLowerCase()}.xlsx`);
    } catch {
      alert("Jadwal belum dapat diekspor. Silakan coba kembali.");
    } finally {
      setExporting(false);
    }
  }

  const scheduleActions = {
    onCreate: openCreate,
    onEdit: openEdit,
    onDelete: handleDelete,
    disabled: !prerequisitesReady,
  };

  return (
    <>
      <div className="print:hidden">
        {!prerequisitesReady && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            Lengkapi tahun ajaran, kelas, mata pelajaran, dan data guru sebelum membuat jadwal.
          </div>
        )}

        <div className="space-y-5">
          <div role="tablist" aria-label="Tampilan jadwal" className="grid grid-cols-2 gap-1.5 rounded-xl border border-[#E8E8EC] bg-white p-1.5 dark:border-white/10 dark:bg-[#19191C]">
            <ViewSwitch
              active={view === "class"}
              icon={Rows3}
              title="Per Kelas"
              description="Susun jadwal mingguan satu kelas"
              onClick={() => setView("class")}
            />
            <ViewSwitch
              active={view === "all"}
              icon={LayoutGrid}
              title="Seluruh Kelas"
              description="Pantau jadwal sekolah dalam matriks"
              onClick={() => setView("all")}
            />
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-[#E8E8EC] bg-white p-4 dark:border-white/10 dark:bg-[#19191C] lg:flex-row lg:items-end">
            <div className={cn("grid min-w-0 gap-3", view === "class" ? "sm:grid-cols-2 lg:w-full lg:max-w-2xl" : "sm:w-80")}>
              <SelectField label="Tahun ajaran" value={yearFilter} onChange={setYearFilter} placeholder="Pilih tahun ajaran">
                {academicYears.map((year) => <SelectItem key={year.id} value={year.id}>{yearLabel(year)}</SelectItem>)}
              </SelectField>
              {view === "class" && (
                <SelectField label="Kelas" value={classFilter} onChange={setClassFilter} placeholder="Pilih kelas">
                  {classes.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} · {item.major.code}</SelectItem>)}
                </SelectField>
              )}
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap lg:ml-auto lg:justify-end">
              {view === "all" && (
                <>
                  <Button variant="outline" className="gap-2" onClick={exportExcel} disabled={exporting || !selectedYear || outputClasses.length === 0}>
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> {exporting ? "Mengekspor..." : "Excel"}
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => window.print()} disabled={!selectedYear || outputClasses.length === 0}>
                    <Printer className="h-4 w-4" /> Cetak / PDF
                  </Button>
                </>
              )}
              <Button className={cn("gap-2 bg-brand text-white hover:bg-brand-strong", view === "all" && "col-span-2")} onClick={() => openCreate(view === "all" ? selectedDay : undefined)} disabled={!prerequisitesReady}>
                <Plus className="h-4 w-4" /> Tambah Jadwal
              </Button>
            </div>
          </div>

          {view === "class" ? (
            <div id="schedule-panel-class" role="tabpanel" className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric icon={BookOpen} label="Total pelajaran" value={String(selectedClassSchedules.length)} />
              <Metric icon={UsersRound} label="Guru pengajar" value={String(uniqueTeachers)} />
              <Metric icon={Clock3} label="Hari aktif" value={`${activeDays} hari`} />
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-brand-soft bg-brand-soft px-4 py-3 dark:border-brand/20 dark:bg-brand/[0.07]">
              <CalendarRange className="h-4 w-4 shrink-0 text-brand-text" />
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Menampilkan jadwal <strong>{selectedClass?.name ?? "kelas"}</strong> untuk {selectedYear ? yearLabel(selectedYear) : "tahun ajaran terpilih"}.
              </p>
            </div>
            <ClassScheduleView schedules={selectedClassSchedules} selectedClass={selectedClass} actions={scheduleActions} />
            </div>
          ) : (
            <div id="schedule-panel-all" role="tabpanel">
            <AllClassesScheduleView
              schedules={selectedYearSchedules}
              classes={classes}
              selectedDay={selectedDay}
              onDayChange={setSelectedDay}
              gradeFilter={gradeFilter}
              onGradeChange={setGradeFilter}
              query={query}
              onQueryChange={setQuery}
              actions={scheduleActions}
            />
            </div>
          )}
        </div>
      </div>

      <PrintableAllClassesSchedule
        schedules={selectedYearSchedules}
        classes={outputClasses}
        academicYearLabel={selectedYear ? yearLabel(selectedYear) : "Tahun ajaran belum dipilih"}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Jadwal Mata Pelajaran" : "Tambah Jadwal Mata Pelajaran"}</DialogTitle>
          </DialogHeader>
          <form key={editing?.id ?? "new"} action={handleSubmit} className="grid gap-4 pt-2 sm:grid-cols-2">
            <SelectField label="Tahun ajaran *" value={academicYearId} onChange={changeAcademicYear} placeholder="Pilih tahun ajaran">
              {academicYears.map((year) => <SelectItem key={year.id} value={year.id}>{yearLabel(year)}</SelectItem>)}
            </SelectField>
            <SelectField label="Kelas *" value={classId} onChange={changeClass} placeholder="Pilih kelas">
              {classes.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} · {item.major.code}</SelectItem>)}
            </SelectField>
            <SelectField label="Mata pelajaran *" value={subjectId} onChange={changeSubject} placeholder="Pilih mata pelajaran">
              {availableSubjects.map((subject) => <SelectItem key={subject.id} value={subject.id}>{subject.code} · {subject.name}</SelectItem>)}
            </SelectField>
            <SelectField label="Guru pengajar *" value={teacherId} onChange={setTeacherId} placeholder="Pilih guru">
              {availableTeachers.map((teacher) => <SelectItem key={teacher.id} value={teacher.id}>{teacher.user.name}{teacher.subject ? ` · ${teacher.subject.code}` : ""}</SelectItem>)}
            </SelectField>
            <SelectField label="Hari *" value={dayOfWeek} onChange={setDayOfWeek} placeholder="Pilih hari">
              {[1, 2, 3, 4, 5, 6].map((day) => <SelectItem key={day} value={String(day)}>{DAY_NAMES[day]}</SelectItem>)}
            </SelectField>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="startTime">Jam mulai *</Label><Input id="startTime" name="startTime" type="time" defaultValue={editing?.startTime ?? "07:00"} required /></div>
              <div className="space-y-1.5"><Label htmlFor="endTime">Jam selesai *</Label><Input id="endTime" name="endTime" type="time" defaultValue={editing?.endTime ?? "07:40"} required /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="room">Ruangan</Label><Input id="room" name="room" defaultValue={editing?.room ?? ""} placeholder="Contoh: Lab Komputer 1" /></div>
            <div className="space-y-1.5"><Label htmlFor="note">Catatan</Label><Input id="note" name="note" defaultValue={editing?.note ?? ""} placeholder="Opsional" /></div>
            {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-2">{error}</p>}
            <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-brand text-white hover:bg-brand-strong" disabled={pending}>{pending ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Buat Jadwal"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SelectField({ label, value, onChange, placeholder, children }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function ViewSwitch({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: typeof Rows3;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex min-h-14 min-w-0 items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors sm:gap-3 sm:px-4",
        active
          ? "border-brand-soft bg-brand-soft text-brand-text dark:border-brand/20 dark:bg-brand/10 dark:text-brand-text"
          : "border-transparent text-gray-700 hover:bg-[#F7F7F9] dark:text-gray-300 dark:hover:bg-white/[0.04]",
      )}
    >
      <span className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-white dark:bg-white/[0.04]",
        active ? "border-brand-soft text-brand-text dark:border-brand/20" : "border-[#E8E8EC] text-gray-500 dark:border-white/10 dark:text-gray-400",
      )}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold sm:text-sm">{title}</span>
        <span className="mt-0.5 hidden truncate text-[11px] font-normal text-gray-400 md:block">{description}</span>
      </span>
    </button>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#E8E8EC] bg-white p-4 dark:border-white/10 dark:bg-[#19191C]">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F7F7F9] text-brand-text dark:bg-white/[0.05] dark:text-brand-text"><Icon className="h-4 w-4" /></div>
      <div><p className="text-xs text-gray-400">{label}</p><p className="mt-0.5 font-heading text-base font-semibold text-gray-900 dark:text-white">{value}</p></div>
    </div>
  );
}
