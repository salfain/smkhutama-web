"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { createMajor, updateMajor, deleteMajor } from "./actions";

type Major = {
  id: string;
  name: string;
  code: string;
  _count: { classes: number; students: number };
};

export function MajorTable({ majors }: { majors: Major[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Major | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setError("");
    setOpen(true);
  }
  function openEdit(m: Major) {
    setEditing(m);
    setError("");
    setOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = editing
        ? await updateMajor(editing.id, formData)
        : await createMajor(formData);
      if (result.error) setError(result.error);
      else setOpen(false);
    });
  }

  function handleDelete(m: Major) {
    if (!confirm(`Hapus jurusan "${m.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteMajor(m.id);
      if (result.error) alert(result.error);
    });
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={openCreate}>
          <Plus className="h-4 w-4" />Tambah Jurusan
        </Button>
      </div>

      {majors.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <Building2 className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada jurusan. Klik tombol di atas untuk menambah.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {majors.map((m) => (
            <div key={m.id} className="rounded-xl border bg-white p-4 shadow-sm hover:border-blue-200 transition-colors">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <Badge variant="secondary" className="font-mono text-xs">{m.code}</Badge>
                  <p className="mt-2 font-semibold text-gray-900">{m.name}</p>
                </div>
                <Building2 className="h-5 w-5 text-blue-500/40" />
              </div>
              <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div className="rounded-lg bg-gray-50 p-2 text-center">
                  <p className="text-base font-bold text-gray-800">{m._count.classes}</p>
                  <p>Kelas</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-2 text-center">
                  <p className="text-base font-bold text-gray-800">{m._count.students}</p>
                  <p>Siswa</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs" onClick={() => openEdit(m)}>
                  <Pencil className="h-3 w-3" />Edit
                </Button>
                <Button variant="outline" size="sm" className="gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(m)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Jurusan" : "Tambah Jurusan"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nama Jurusan</Label>
              <Input id="name" name="name" defaultValue={editing?.name ?? ""} placeholder="cth: Teknik Komputer & Jaringan" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code">Kode Jurusan</Label>
              <Input id="code" name="code" defaultValue={editing?.code ?? ""} placeholder="cth: TKJ" maxLength={10} className="uppercase font-mono" required />
            </div>
            {error && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={pending}>
                {pending ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Jurusan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
