"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, BookOpen, Search } from "lucide-react";
import { createSubject, updateSubject, deleteSubject } from "./actions";
import { useConfirm } from "@/components/ConfirmDialog";

type Subject = {
  id: string;
  name: string;
  code: string;
  majorId: string | null;
  major: { name: string; code: string } | null;
  _count: { questions: number; exams: number; teachers: number };
};

type Major = { id: string; name: string; code: string };

export function SubjectTable({ subjects, majors }: { subjects: Subject[]; majors: Major[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [majorId, setMajorId] = useState<string>("none");
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function openCreate() {
    setEditing(null);
    setMajorId("none");
    setError("");
    setOpen(true);
  }

  function openEdit(s: Subject) {
    setEditing(s);
    setMajorId(s.majorId ?? "none");
    setError("");
    setOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    setError("");
    formData.set("majorId", majorId === "none" ? "" : majorId);
    startTransition(async () => {
      const result = editing
        ? await updateSubject(editing.id, formData)
        : await createSubject(formData);
      if (result.error) setError(result.error);
      else setOpen(false);
    });
  }

  async function handleDelete(s: Subject) {
    if (!(await confirm(`Hapus mata pelajaran "${s.name}"?`))) return;
    startTransition(async () => {
      const result = await deleteSubject(s.id);
      if (result.error) alert(result.error);
    });
  }

  const filtered = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Cari mata pelajaran..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 sm:ml-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" />Tambah Mapel
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <BookOpen className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">{subjects.length === 0 ? "Belum ada mata pelajaran." : "Tidak ada hasil pencarian."}</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 w-12">No</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Nama Mata Pelajaran</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Kode</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Jurusan</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Soal</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Ujian</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((s, i) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3"><Badge variant="secondary" className="font-mono text-xs">{s.code}</Badge></td>
                    <td className="px-4 py-3 text-gray-600">{s.major ? `${s.major.code} – ${s.major.name}` : <span className="text-gray-400">— Umum —</span>}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{s._count.questions}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{s._count.exams}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => openEdit(s)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(s)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nama Mata Pelajaran</Label>
              <Input id="name" name="name" defaultValue={editing?.name ?? ""} placeholder="cth: Matematika" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code">Kode</Label>
              <Input id="code" name="code" defaultValue={editing?.code ?? ""} placeholder="cth: MTK" maxLength={10} className="uppercase font-mono" required />
            </div>
            <div className="space-y-1.5">
              <Label>Jurusan (opsional)</Label>
              <Select value={majorId} onValueChange={setMajorId}>
                <SelectTrigger><SelectValue placeholder="Pilih jurusan..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Umum (semua jurusan) —</SelectItem>
                  {majors.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.code} – {m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">Kosongkan jika mata pelajaran umum</p>
            </div>
            {error && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={pending}>
                {pending ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Mapel"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
