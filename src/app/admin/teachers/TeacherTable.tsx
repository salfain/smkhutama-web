"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus, Pencil, Trash2, Search, RotateCcw, UserCheck, UserX,
  GraduationCap, Download, Upload, FileDown, AlertCircle, CheckCircle,
} from "lucide-react";
import {
  createTeacher, updateTeacher, deleteTeacher,
  toggleTeacherStatus, resetTeacherPassword,
  exportTeachersExcel, importTeachersExcel, getTeacherImportTemplate,
} from "./actions";

type Teacher = {
  id: string;
  nip: string | null;
  subjectId: string | null;
  user: { name: string; username: string; email: string | null; isActive: boolean };
  subject: { name: string; code: string } | null;
  _count: { questions: number; exams: number };
};
type Subject = { id: string; name: string; code: string };

export function TeacherTable({ teachers, subjects }: { teachers: Teacher[]; subjects: Subject[] }) {
  const [open, setOpen]             = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing]       = useState<Teacher | null>(null);
  const [search, setSearch]         = useState("");
  const [error, setError]           = useState("");
  const [subjectId, setSubjectId]   = useState<string>("none");
  const [importMsg, setImportMsg]   = useState<{ msg: string; errors?: string[] } | null>(null);
  const [pending, startTransition]  = useTransition();
  const importFileRef               = useRef<HTMLInputElement>(null);

  // ---------- handlers ----------
  function openCreate() {
    setEditing(null); setSubjectId("none"); setError(""); setOpen(true);
  }
  function openEdit(t: Teacher) {
    setEditing(t); setSubjectId(t.subjectId ?? "none"); setError(""); setOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    setError("");
    formData.set("subjectId", subjectId === "none" ? "" : subjectId);
    startTransition(async () => {
      const result = editing
        ? await updateTeacher(editing.id, formData)
        : await createTeacher(formData);
      if (result.error) setError(result.error); else setOpen(false);
    });
  }

  function handleDelete(t: Teacher) {
    if (!confirm(`Hapus guru "${t.user.name}"? Akun login juga akan dihapus.`)) return;
    startTransition(async () => {
      const result = await deleteTeacher(t.id);
      if (result.error) alert(result.error);
    });
  }

  function handleToggle(t: Teacher) {
    startTransition(async () => { await toggleTeacherStatus(t.id); });
  }

  function handleReset(t: Teacher) {
    if (!confirm(`Reset password "${t.user.name}" ke "guru123"?`)) return;
    startTransition(async () => {
      const result = await resetTeacherPassword(t.id);
      if (result.error) alert(result.error);
      else alert(`Password berhasil direset: ${result.password}`);
    });
  }

  function downloadBlob(data: number[], filename: string) {
    const blob = new Blob(
      [new Uint8Array(data)],
      { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function handleExport() {
    startTransition(async () => {
      const result = await exportTeachersExcel();
      downloadBlob(result.data, result.filename);
    });
  }

  function handleDownloadTemplate() {
    startTransition(async () => {
      const result = await getTeacherImportTemplate();
      downloadBlob(result.data, result.filename);
    });
  }

  async function handleImport(formData: FormData) {
    setImportMsg(null);
    startTransition(async () => {
      const result = await importTeachersExcel(formData);
      if (result.error) {
        setImportMsg({ msg: result.error });
      } else {
        setImportMsg({ msg: result.message ?? "Import selesai", errors: result.errors });
        if (importFileRef.current) importFileRef.current.value = "";
      }
    });
  }

  const filtered = teachers.filter(
    (t) =>
      t.user.name.toLowerCase().includes(search.toLowerCase()) ||
      t.user.username.toLowerCase().includes(search.toLowerCase()) ||
      (t.nip ?? "").includes(search)
  );

  return (
    <>
      {/* ---- Toolbar ---- */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari nama, username, atau NIP..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <Button variant="outline" size="sm" className="gap-1.5"
            onClick={() => { setImportMsg(null); setImportOpen(true); }}>
            <Upload className="h-4 w-4" />Import
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5"
            onClick={handleExport} disabled={pending}>
            <Download className="h-4 w-4" />Export
          </Button>
          <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700"
            onClick={openCreate}>
            <Plus className="h-4 w-4" />Tambah Guru
          </Button>
        </div>
      </div>

      {/* ---- Table ---- */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <GraduationCap className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">
            {teachers.length === 0 ? "Belum ada guru terdaftar." : "Tidak ada hasil pencarian."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["No","Nama Guru","NIP","Username","Mapel","Soal","Ujian","Status","Aksi"].map((h) => (
                    <th key={h} className={`px-4 py-3 font-semibold text-gray-600 ${h === "Aksi" || h === "Soal" || h === "Ujian" ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((t, i) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{t.user.name}</p>
                      {t.user.email && <p className="text-xs text-gray-400">{t.user.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{t.nip ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{t.user.username}</td>
                    <td className="px-4 py-3">
                      {t.subject
                        ? <Badge variant="secondary">{t.subject.code}</Badge>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{t._count.questions}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{t._count.exams}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={t.user.isActive
                        ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                        : "bg-red-100 text-red-600 border-red-200 hover:bg-red-100"}>
                        {t.user.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" title="Edit" onClick={() => openEdit(t)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-600 hover:bg-orange-50" title="Reset Password" onClick={() => handleReset(t)}>
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon"
                          className={`h-8 w-8 ${t.user.isActive ? "text-yellow-600 hover:bg-yellow-50" : "text-green-600 hover:bg-green-50"}`}
                          title={t.user.isActive ? "Nonaktifkan" : "Aktifkan"}
                          onClick={() => handleToggle(t)}>
                          {t.user.isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" title="Hapus" onClick={() => handleDelete(t)}>
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
            Menampilkan {filtered.length} dari {teachers.length} guru
          </div>
        </div>
      )}

      {/* ---- Add / Edit Dialog ---- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Guru" : "Tambah Guru"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nama Lengkap *</Label>
              <Input id="name" name="name" defaultValue={editing?.user.name ?? ""} placeholder="cth: Ibu Sari Dewi, S.Pd" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username *</Label>
                <Input id="username" name="username" defaultValue={editing?.user.username ?? ""} placeholder="cth: sari.dewi" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nip">NIP / NUPTK</Label>
                <Input id="nip" name="nip" defaultValue={editing?.nip ?? ""} placeholder="opsional" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={editing?.user.email ?? ""} placeholder="opsional" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">
                Password{" "}
                {editing
                  ? <span className="text-xs text-gray-400">(kosongkan jika tidak diubah)</span>
                  : <span className="text-xs text-gray-400">*</span>}
              </Label>
              <Input
                id="password" name="password" type="password"
                placeholder="Min. 6 karakter"
                {...(!editing && { required: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mata Pelajaran Utama</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Belum ditentukan —</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.code} – {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={pending}>
                {pending ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Guru"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---- Import Dialog ---- */}
      <Dialog open={importOpen} onOpenChange={(v) => { setImportOpen(v); setImportMsg(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Guru dari Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Info kolom */}
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700 space-y-1">
              <p className="font-semibold">Kolom yang diperlukan:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li><span className="font-medium">Nama Lengkap</span> — wajib</li>
                <li><span className="font-medium">Username</span> — wajib, harus unik</li>
                <li><span className="font-medium">Password</span> — wajib, min 6 karakter</li>
                <li><span className="font-medium">NIP/NUPTK</span> — opsional</li>
                <li><span className="font-medium">Email</span> — opsional</li>
                <li><span className="font-medium">Kode Mapel</span> — opsional (cth: MTK, BIG)</li>
              </ul>
            </div>

            {/* Download template */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 border p-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Download Template</p>
                <p className="text-xs text-gray-400">File Excel dengan format & contoh data</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 ml-3 shrink-0"
                onClick={handleDownloadTemplate} disabled={pending}>
                <FileDown className="h-4 w-4" />Template
              </Button>
            </div>

            {/* Upload & submit */}
            <form action={handleImport} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="teacher-file">Pilih File Excel *</Label>
                <Input
                  ref={importFileRef}
                  id="teacher-file" name="file" type="file"
                  accept=".xlsx,.xls" required
                />
                <p className="text-xs text-gray-400">Format .xlsx atau .xls</p>
              </div>

              {/* Result message */}
              {importMsg && (
                <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                  importMsg.errors
                    ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                    : "bg-green-50 border-green-200 text-green-700"
                }`}>
                  {importMsg.errors
                    ? <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    : <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                  <div>
                    <p className="font-medium">{importMsg.msg}</p>
                    {importMsg.errors?.map((e, i) => (
                      <p key={i} className="text-xs mt-0.5 opacity-80">{e}</p>
                    ))}
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
