"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Search, Calendar, Clock, Users, Pencil, Trash2,
  PlayCircle, StopCircle, FileText, ClipboardList, Filter,
} from "lucide-react";
import {
  createExam, updateExam, deleteExam, changeExamStatus,
} from "./actions";
import { EXAM_TYPES, getExamTypeInfo } from "@/lib/exam-types";
import { useConfirm } from "@/components/ConfirmDialog";
import { toDatetimeLocalWIB } from "@/lib/date";

type Exam = {
  id: string;
  title: string;
  durationMinutes: number;
  startAt: Date;
  endAt: Date;
  status: "DRAFT" | "ACTIVE" | "CLOSED";
  examType: "UH" | "UTS" | "UAS" | "US" | "TRYOUT" | "LAINNYA";
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  showResult: boolean;
  passingScore: number | null;
  subjectId: string;
  teacherId: string;
  academicYearId: string | null;
  subject: { name: string; code: string };
  teacher: { user: { name: string } };
  classes: { class: { name: string } }[];
  _count: { questions: number; attempts: number };
};

type FormDataOpts = {
  subjects: { id: string; name: string; code: string }[];
  teachers: { id: string; user: { name: string }; subject: { code: string } | null }[];
  classes: { id: string; name: string }[];
  academicYears: { id: string; year: string; semester: string; isActive: boolean }[];
};

const statusStyle: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  DRAFT:  "bg-yellow-100 text-yellow-700 border-yellow-200",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
};
const statusLabel: Record<string, string> = {
  ACTIVE: "Aktif", DRAFT: "Draft", CLOSED: "Selesai",
};

function fmtDateTime(d: Date) {
  return new Date(d).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function toDatetimeLocal(d: Date) {
  return toDatetimeLocalWIB(d);
}

export function ExamTable({ exams, opts }: { exams: Exam[]; opts: FormDataOpts }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  // controlled fields
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("none");
  const [statusVal, setStatusVal] = useState<"DRAFT" | "ACTIVE" | "CLOSED">("DRAFT");
  const [examType, setExamType] = useState<"UH" | "UTS" | "UAS" | "US" | "TRYOUT" | "LAINNYA">("UH");
  const [classIds, setClassIds] = useState<string[]>([]);

  function openCreate() {
    setEditing(null);
    setSubjectId(""); setTeacherId(""); setStatusVal("DRAFT"); setExamType("UH");
    const activeYear = opts.academicYears.find((y) => y.isActive);
    setAcademicYearId(activeYear?.id ?? "none");
    setClassIds([]);
    setError(""); setOpen(true);
  }

  function openEdit(e: Exam) {
    setEditing(e);
    setSubjectId(e.subjectId);
    setTeacherId(e.teacherId);
    setAcademicYearId(e.academicYearId ?? "none");
    setStatusVal(e.status);
    setExamType(e.examType);
    // map class names back to ids
    const ids = e.classes
      .map((ec) => opts.classes.find((c) => c.name === ec.class.name)?.id)
      .filter(Boolean) as string[];
    setClassIds(ids);
    setError(""); setOpen(true);
  }

  function toggleClass(id: string) {
    setClassIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }

  async function handleSubmit(formData: FormData) {
    setError("");
    formData.set("subjectId", subjectId);
    formData.set("teacherId", teacherId);
    formData.set("academicYearId", academicYearId === "none" ? "" : academicYearId);
    formData.set("status", statusVal);
    formData.set("examType", examType);
    formData.delete("classIds");
    classIds.forEach((id) => formData.append("classIds", id));

    startTransition(async () => {
      const r = editing ? await updateExam(editing.id, formData) : await createExam(formData);
      if (r.error) setError(r.error); else setOpen(false);
    });
  }

  async function handleDelete(e: Exam) {
    // Modal konfirmasi HARUS di luar startTransition agar dialog tidak
    // tertunda render-nya dan transisi tidak nyangkut.
    if (!(await confirm({ title: "Hapus ujian?", description: `Ujian "${e.title}" akan dihapus.`, confirmText: "Hapus" }))) return;

    const r = await deleteExam(e.id);
    if (!r.error) return; // revalidatePath di server action menyegarkan daftar

    if ("hasAttempts" in r && r.hasAttempts) {
      const forceConfirm = await confirm({
        title: "Hapus paksa?",
        description: `${r.error} PERHATIAN: hapus paksa akan menghapus SEMUA jawaban & nilai siswa terkait ujian ini. Data tidak bisa dikembalikan.`,
        confirmText: "Hapus Paksa", variant: "danger", icon: "warning",
      });
      if (forceConfirm) {
        const r2 = await deleteExam(e.id, true);
        if (r2.error) alert(r2.error);
      }
    } else {
      alert(r.error);
    }
  }

  function handleChangeStatus(e: Exam, status: "DRAFT" | "ACTIVE" | "CLOSED") {
    startTransition(async () => {
      await changeExamStatus(e.id, status);
    });
  }

  const filtered = exams.filter(
    (e) => (e.title.toLowerCase().includes(search.toLowerCase()) ||
            e.subject.code.toLowerCase().includes(search.toLowerCase())) &&
           (filterType === "all" || e.examType === filterType)
  );

  // Filter teachers based on selected subject
  const filteredTeachers = subjectId
    ? opts.teachers.filter((t) => !t.subject || t.subject.code === opts.subjects.find((s) => s.id === subjectId)?.code)
    : opts.teachers;

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Cari ujian..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="mr-2 h-4 w-4 text-gray-400" />
            <SelectValue placeholder="Jenis Ujian" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis</SelectItem>
            {EXAM_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.short} – {t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 sm:ml-auto"
          disabled={opts.subjects.length === 0 || opts.teachers.length === 0}
          onClick={openCreate}>
          <Plus className="h-4 w-4" />Tambah Jadwal
        </Button>
      </div>

      {(opts.subjects.length === 0 || opts.teachers.length === 0) && (
        <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          ⚠ Pastikan sudah ada <a href="/admin/subjects" className="font-semibold underline">mata pelajaran</a> dan <a href="/admin/teachers" className="font-semibold underline">guru</a> sebelum membuat jadwal ujian.
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <ClipboardList className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">{exams.length === 0 ? "Belum ada jadwal ujian." : "Tidak ada hasil pencarian."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => {
            const typeInfo = getExamTypeInfo(e.examType);
            return (
            <div key={e.id} className="rounded-xl border bg-white p-4 shadow-sm hover:border-blue-200 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{e.title}</p>
                    <Badge className={`text-xs hover:opacity-100 ${typeInfo.color}`}>{typeInfo.short}</Badge>
                    <Badge variant="secondary" className="font-mono text-xs">{e.subject.code}</Badge>
                    <Badge className={`text-xs hover:opacity-100 ${statusStyle[e.status]}`}>
                      {e.status === "ACTIVE" && "● "}{statusLabel[e.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{e.teacher.user.name}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{fmtDateTime(e.startAt)}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{e.durationMinutes} menit</span>
                    <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{e._count.questions} soal</span>
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{e._count.attempts} peserta</span>
                    {e.classes.length > 0 && (
                      <span className="flex items-center gap-1">
                        Kelas: {e.classes.map((c) => c.class.name).join(", ")}
                      </span>
                    )}
                    {e.passingScore !== null && (
                      <span>KKM: <strong>{e.passingScore}</strong></span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {e.status === "DRAFT" && (
                    <Button variant="outline" size="sm" className="gap-1 text-xs text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleChangeStatus(e, "ACTIVE")}>
                      <PlayCircle className="h-3.5 w-3.5" />Aktifkan
                    </Button>
                  )}
                  {e.status === "ACTIVE" && (
                    <Button variant="outline" size="sm" className="gap-1 text-xs text-gray-600 border-gray-200" onClick={() => handleChangeStatus(e, "CLOSED")}>
                      <StopCircle className="h-3.5 w-3.5" />Tutup
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => openEdit(e)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(e)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Jadwal Ujian" : "Tambah Jadwal Ujian"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label htmlFor="title">Judul Ujian *</Label>
              <Input id="title" name="title" defaultValue={editing?.title ?? ""} placeholder="cth: UTS Matematika XII TKJ 1" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Jenis Ujian *</Label>
                <Select value={examType} onValueChange={(v) => setExamType(v as typeof examType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.short} – {t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Mata Pelajaran *</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                  <SelectContent>
                    {opts.subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.code} – {s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label>Guru Pengampu *</Label>
                <Select value={teacherId} onValueChange={setTeacherId}>
                  <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                  <SelectContent>
                    {filteredTeachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.user.name}{t.subject ? ` (${t.subject.code})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startAt">Waktu Mulai *</Label>
                <Input
                  id="startAt" name="startAt" type="datetime-local"
                  defaultValue={editing ? toDatetimeLocal(editing.startAt) : ""}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endAt">Waktu Selesai *</Label>
                <Input
                  id="endAt" name="endAt" type="datetime-local"
                  defaultValue={editing ? toDatetimeLocal(editing.endAt) : ""}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="durationMinutes">Durasi (menit) *</Label>
                <Input id="durationMinutes" name="durationMinutes" type="number" min="1" defaultValue={editing?.durationMinutes ?? 90} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="passingScore">KKM</Label>
                <Input id="passingScore" name="passingScore" type="number" min="0" max="100" defaultValue={editing?.passingScore ?? ""} placeholder="75" />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={statusVal} onValueChange={(v) => setStatusVal(v as "DRAFT" | "ACTIVE" | "CLOSED")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Aktif</SelectItem>
                    <SelectItem value="CLOSED">Tutup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tahun Ajaran</Label>
              <Select value={academicYearId} onValueChange={setAcademicYearId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tidak diset —</SelectItem>
                  {opts.academicYears.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.year} {y.semester === "GANJIL" ? "Ganjil" : "Genap"}{y.isActive ? " (Aktif)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Kelas Peserta</Label>
              <div className="rounded-lg border bg-gray-50 p-3 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {opts.classes.length === 0 ? (
                  <p className="col-span-2 text-xs text-gray-400">Belum ada kelas. <a href="/admin/classes" className="underline">Buat kelas dulu</a></p>
                ) : opts.classes.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      checked={classIds.includes(c.id)} onChange={() => toggleClass(c.id)} />
                    {c.name}
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400">{classIds.length} kelas dipilih</p>
            </div>

            <div className="space-y-2 rounded-lg border p-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-600">Opsi Ujian</p>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" name="randomizeQuestions" defaultChecked={editing?.randomizeQuestions ?? false} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                Acak urutan soal
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" name="randomizeOptions" defaultChecked={editing?.randomizeOptions ?? false} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                Acak urutan pilihan jawaban
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" name="showResult" defaultChecked={editing?.showResult ?? false} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                Tampilkan nilai langsung setelah submit
              </label>
            </div>

            {error && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={pending}>
                {pending ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Buat Jadwal"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
