"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Search, Upload, Download, FileDown, Pencil,
  Trash2, RotateCcw, UserCheck, UserX, Users, AlertCircle, CheckCircle,
} from "lucide-react";
import {
  createStudent, updateStudent, deleteStudent,
  toggleStudentStatus, resetStudentPassword,
  exportStudentsExcel, importStudentsExcel, getImportTemplate,
  deleteAllStudents,
} from "./actions";
import { useConfirm } from "@/components/ConfirmDialog";

type Student = {
  id: string;
  nis: string | null;
  nisn: string | null;
  gender: "MALE" | "FEMALE" | null;
  user: { name: string; username: string; isActive: boolean };
  class: { name: string } | null;
  major: { name: string; code: string } | null;
};
type Class = { id: string; name: string; grade: string; majorId: string };
type Major = { id: string; name: string; code: string };

export function StudentTable({
  students, classes, majors,
}: { students: Student[]; classes: Class[]; majors: Major[] }) {
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [error, setError] = useState("");
  const [classId, setClassId] = useState<string>("none");
  const [majorId, setMajorId] = useState<string>("none");
  const [gender, setGender] = useState<string>("none");
  const [importMsg, setImportMsg] = useState<{msg: string; errors?: string[]} | null>(null);
  const [pending, startTransition] = useTransition();
  const importFileRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();

  function openCreate() {
    setEditing(null);
    setClassId("none"); setMajorId("none"); setGender("none");
    setError(""); setOpen(true);
  }
  function openEdit(s: Student) {
    setEditing(s);
    setClassId(classes.find(c => c.name === s.class?.name)?.id ?? "none");
    setMajorId(majors.find(m => m.code === s.major?.code)?.id ?? "none");
    setGender(s.gender ?? "none");
    setError(""); setOpen(true);
  }

  // Auto-fill major when class changes
  function handleClassChange(val: string) {
    setClassId(val);
    if (val !== "none") {
      const cls = classes.find(c => c.id === val);
      if (cls) setMajorId(cls.majorId);
    }
  }

  async function handleSubmit(formData: FormData) {
    setError("");
    formData.set("classId", classId === "none" ? "" : classId);
    formData.set("majorId", majorId === "none" ? "" : majorId);
    formData.set("gender", gender === "none" ? "" : gender);
    startTransition(async () => {
      const result = editing ? await updateStudent(editing.id, formData) : await createStudent(formData);
      if (result.error) setError(result.error); else setOpen(false);
    });
  }

  async function handleDelete(s: Student) {
    if (!(await confirm(`Hapus siswa "${s.user.name}"?`))) return;
    startTransition(async () => {
      const result = await deleteStudent(s.id);
      if (result.error) alert(result.error);
    });
  }

  function handleToggle(s: Student) {
    startTransition(async () => { await toggleStudentStatus(s.id); });
  }

  async function handleReset(s: Student) {
    if (!(await confirm(`Reset password "${s.user.name}" ke "siswa123"?`))) return;
    startTransition(async () => {
      const result = await resetStudentPassword(s.id);
      if (result.error) alert(result.error);
      else alert(`Password berhasil direset: ${result.password}`);
    });
  }

  function handleExport() {
    startTransition(async () => {
      const result = await exportStudentsExcel();
      const blob = new Blob([new Uint8Array(result.data)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = result.filename; a.click();
      URL.revokeObjectURL(url);
    });
  }

  async function handleDeleteAll() {
    // Konfirmasi pertama (visual)
    const ok1 = await confirm({
      title: "⚠️ BAHAYA — Hapus Semua Siswa",
      description: `Tindakan ini akan MENGHAPUS SEMUA ${students.length} siswa beserta akun, jawaban ujian, data BK, dan seluruh riwayat mereka. DATA TIDAK BISA DIKEMBALIKAN.`,
      confirmText: "Ya, Saya Paham",
      cancelText: "Batal",
      variant: "danger",
      icon: "warning",
    });
    if (!ok1) return;

    // Konfirmasi kedua (harus ketik teks)
    const input = window.prompt(
      `KONFIRMASI AKHIR:\nKetik "HAPUS SEMUA SISWA" (huruf kapital, tanpa tanda petik) untuk melanjutkan.\n\nSemua data ${students.length} siswa akan dihapus permanen.`
    );
    if (input !== "HAPUS SEMUA SISWA") {
      alert("Teks tidak cocok. Penghapusan dibatalkan.");
      return;
    }

    startTransition(async () => {
      const r = await deleteAllStudents();
      if (r.error) { alert(r.error); return; }
      alert(`✅ ${r.count} siswa berhasil dihapus.`);
    });
  }

  function handleDownloadTemplate() {
    startTransition(async () => {
      const result = await getImportTemplate();
      const blob = new Blob([new Uint8Array(result.data)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = result.filename; a.click();
      URL.revokeObjectURL(url);
    });
  }

  async function handleImport(formData: FormData) {
    setImportMsg(null);
    startTransition(async () => {
      const result = await importStudentsExcel(formData);
      if (result.error) setImportMsg({ msg: result.error });
      else {
        setImportMsg({ msg: result.message ?? "Import selesai", errors: result.errors });
        if (importFileRef.current) importFileRef.current.value = "";
      }
    });
  }

  const filtered = students.filter(s => {
    const matchSearch = s.user.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.nis ?? "").includes(search) || s.user.username.includes(search);
    const matchClass = filterClass === "all" || s.class?.name === filterClass;
    return matchSearch && matchClass;
  });

  const uniqueClasses = [...new Set(students.map(s => s.class?.name).filter(Boolean))].sort() as string[];

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Cari nama, NIS, username..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Semua Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {uniqueClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-2 sm:ml-auto flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={handleDeleteAll} disabled={pending}>
            <Trash2 className="h-4 w-4" />Hapus Semua
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" />Import
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport} disabled={pending}>
            <Download className="h-4 w-4" />Export
          </Button>
          <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={openCreate}>
            <Plus className="h-4 w-4" />Tambah
          </Button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">{students.length === 0 ? "Belum ada siswa." : "Tidak ada hasil pencarian."}</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["No","Nama Siswa","NIS / NISN","Username","Kelas","Jurusan","L/P","Status","Aksi"].map(h => (
                    <th key={h} className={`px-4 py-3 font-semibold text-gray-600 ${h === "Aksi" ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((s, i) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.user.name}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">
                      <p>{s.nis ?? "—"}</p>
                      <p className="text-gray-400">{s.nisn ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.user.username}</td>
                    <td className="px-4 py-3 text-gray-600">{s.class?.name ?? <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3">
                      {s.major ? <Badge variant="secondary">{s.major.code}</Badge> : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.gender === "MALE" ? "L" : s.gender === "FEMALE" ? "P" : "—"}</td>
                    <td className="px-4 py-3">
                      <Badge className={s.user.isActive ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" : "bg-red-100 text-red-600 border-red-200 hover:bg-red-100"}>
                        {s.user.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" title="Edit" onClick={() => openEdit(s)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" title="Reset Password" onClick={() => handleReset(s)}>
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className={`h-8 w-8 ${s.user.isActive ? "text-yellow-600 hover:bg-yellow-50" : "text-green-600 hover:bg-green-50"}`} title={s.user.isActive ? "Nonaktifkan" : "Aktifkan"} onClick={() => handleToggle(s)}>
                          {s.user.isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" title="Hapus" onClick={() => handleDelete(s)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t px-4 py-2.5 text-xs text-gray-400">
            Menampilkan {filtered.length} dari {students.length} siswa
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Siswa" : "Tambah Siswa Baru"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="name">Nama Lengkap *</Label>
                <Input id="name" name="name" defaultValue={editing?.user.name ?? ""} placeholder="Nama siswa" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="username">Username *</Label>
                <Input id="username" name="username" defaultValue={editing?.user.username ?? ""} placeholder="cth: 2324001" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nis">NIS</Label>
                <Input id="nis" name="nis" defaultValue={editing?.nis ?? ""} placeholder="Nomor Induk Siswa" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nisn">NISN</Label>
                <Input id="nisn" name="nisn" defaultValue={editing?.nisn ?? ""} placeholder="NISN" />
              </div>
              <div className="space-y-1.5">
                <Label>Jenis Kelamin</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Tidak diisi —</SelectItem>
                    <SelectItem value="MALE">Laki-laki</SelectItem>
                    <SelectItem value="FEMALE">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Kelas</Label>
                <Select value={classId} onValueChange={handleClassChange}>
                  <SelectTrigger><SelectValue placeholder="Pilih kelas..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Belum ditentukan —</SelectItem>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Jurusan</Label>
                <Select value={majorId} onValueChange={setMajorId}>
                  <SelectTrigger><SelectValue placeholder="Pilih jurusan..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Belum ditentukan —</SelectItem>
                    {majors.map(m => <SelectItem key={m.id} value={m.id}>{m.code} – {m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password {editing && <span className="text-xs text-gray-400">(kosongkan jika tidak diubah)</span>}</Label>
                <Input id="password" name="password" type="password" placeholder={editing ? "••••••" : "Default: siswa123"} />
              </div>
            </div>
            {error && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={pending}>
                {pending ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Siswa"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={(v) => { setImportOpen(v); setImportMsg(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Siswa dari Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Info kolom */}
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700 space-y-1">
              <p className="font-semibold">Kolom yang diperlukan:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li><span className="font-medium">Nama Lengkap</span> — wajib</li>
                <li><span className="font-medium">Username</span> — wajib, harus unik</li>
                <li><span className="font-medium">Password</span> — wajib, min 6 karakter <span className="opacity-70">(default = username jika kosong)</span></li>
                <li><span className="font-medium">NIS</span> — opsional</li>
                <li><span className="font-medium">NISN</span> — opsional</li>
                <li><span className="font-medium">Kelas</span> — opsional (cth: XII TKJ 1)</li>
                <li><span className="font-medium">L/P</span> — opsional (L / P)</li>
              </ul>
            </div>
            {/* Download template */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 border p-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Download Template</p>
                <p className="text-xs text-gray-400">File Excel dengan kolom Password</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 ml-3 shrink-0" onClick={handleDownloadTemplate} disabled={pending}>
                <FileDown className="h-4 w-4" />Template
              </Button>
            </div>            <form action={handleImport} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="file">Pilih File Excel</Label>
                <Input ref={importFileRef} id="file" name="file" type="file" accept=".xlsx,.xls" required />
                <p className="text-xs text-gray-400">Format: .xlsx atau .xls · Kolom: Nama Lengkap, Username, Password, NIS, NISN, Kelas, L/P</p>
              </div>
              {importMsg && (
                <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${importMsg.errors ? "bg-yellow-50 border-yellow-200 text-yellow-800" : "bg-green-50 border-green-200 text-green-700"}`}>
                  {importMsg.errors ? <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> : <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                  <div>
                    <p>{importMsg.msg}</p>
                    {importMsg.errors?.map((e, i) => <p key={i} className="text-xs mt-0.5">{e}</p>)}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>Tutup</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={pending}>
                  {pending ? "Mengimport..." : "Import Sekarang"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
