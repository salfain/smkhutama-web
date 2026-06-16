"use client";

import { useState, useTransition } from "react";
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
import { Plus, Pencil, Trash2, Building2, Search, Users } from "lucide-react";
import { createClass, updateClass, deleteClass } from "./actions";

type Class = {
  id: string;
  name: string;
  grade: string;
  majorId: string;
  homeroomTeacherId?: string | null;
  major: { name: string; code: string };
  homeroomTeacher?: { user: { name: string } } | null;
  _count: { students: number };
};

type Major = { id: string; name: string; code: string };
type Teacher = { id: string; name: string };

export function ClassTable({ classes, majors, teachers }: { classes: Class[]; majors: Major[]; teachers: Teacher[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Class | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [grade, setGrade] = useState("X");
  const [majorId, setMajorId] = useState<string>("");
  const [homeroomTeacherId, setHomeroomTeacherId] = useState<string>("none");
  const [pending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setGrade("X");
    setMajorId(majors[0]?.id ?? "");
    setHomeroomTeacherId("none");
    setError("");
    setOpen(true);
  }

  function openEdit(c: Class) {
    setEditing(c);
    setGrade(c.grade);
    setMajorId(c.majorId);
    setHomeroomTeacherId(c.homeroomTeacherId ?? "none");
    setError("");
    setOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    setError("");
    formData.set("grade", grade);
    formData.set("majorId", majorId);
    formData.set("homeroomTeacherId", homeroomTeacherId === "none" ? "" : homeroomTeacherId);
    startTransition(async () => {
      const result = editing
        ? await updateClass(editing.id, formData)
        : await createClass(formData);
      if (result.error) setError(result.error);
      else setOpen(false);
    });
  }

  function handleDelete(c: Class) {
    if (!confirm(`Hapus kelas "${c.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteClass(c.id);
      if (result.error) alert(result.error);
    });
  }

  const filtered = classes.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) ||
           c.major.code.toLowerCase().includes(search.toLowerCase())
  );

  // Group by grade
  const grouped = filtered.reduce<Record<string, Class[]>>((acc, c) => {
    (acc[c.grade] ??= []).push(c);
    return acc;
  }, {});

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Cari kelas..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 sm:ml-auto" onClick={openCreate} disabled={majors.length === 0}>
          <Plus className="h-4 w-4" />Tambah Kelas
        </Button>
      </div>

      {majors.length === 0 && (
        <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          ⚠ Belum ada jurusan. <a href="/admin/majors" className="font-semibold underline">Buat jurusan terlebih dahulu</a> sebelum menambah kelas.
        </div>
      )}

      {classes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <Building2 className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada kelas terdaftar.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([grade, list]) => (
            <div key={grade}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Tingkat {grade}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((c) => (
                  <div key={c.id} className="rounded-xl border bg-white p-4 shadow-sm hover:border-blue-200 transition-colors">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{c.name}</p>
                        <Badge variant="secondary" className="mt-1 font-mono text-xs">{c.major.code}</Badge>
                      </div>
                      <div className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        <Users className="h-3 w-3" />{c._count.students}
                      </div>
                    </div>
                    <p className="mb-3 text-xs text-gray-400">{c.major.name}</p>
                    {c.homeroomTeacher && (
                      <p className="mb-3 -mt-2 text-xs text-purple-600">Wali: {c.homeroomTeacher.user.name}</p>
                    )}
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs" onClick={() => openEdit(c)}>
                        <Pencil className="h-3 w-3" />Edit
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(c)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Kelas" : "Tambah Kelas"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nama Kelas</Label>
              <Input id="name" name="name" defaultValue={editing?.name ?? ""} placeholder="cth: XII TKJ 1" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tingkat</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="X">X</SelectItem>
                    <SelectItem value="XI">XI</SelectItem>
                    <SelectItem value="XII">XII</SelectItem>
                    <SelectItem value="XIII">XIII</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Jurusan</Label>
                <Select value={majorId} onValueChange={setMajorId}>
                  <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                  <SelectContent>
                    {majors.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Wali Kelas (Guru BK access)</Label>
              <Select value={homeroomTeacherId} onValueChange={setHomeroomTeacherId}>
                <SelectTrigger><SelectValue placeholder="Pilih wali kelas..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tidak ada —</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={pending}>
                {pending ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Kelas"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
