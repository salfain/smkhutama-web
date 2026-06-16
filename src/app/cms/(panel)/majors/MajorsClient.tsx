"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, GraduationCap } from "lucide-react";
import { saveMajor, deleteMajor } from "../content-actions";

type Major = { id: string; code: string; name: string; description: string };

export function MajorsClient({ majors }: { majors: Major[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Major | null>(null);
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(fd: FormData) {
    setErr("");
    if (editing) fd.set("id", editing.id);
    startTransition(async () => {
      const r = await saveMajor(fd);
      if (r.error) setErr(r.error); else setOpen(false);
    });
  }
  function remove(id: string) {
    if (!confirm("Hapus jurusan ini?")) return;
    startTransition(async () => { await deleteMajor(id); });
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex justify-end">
        <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={() => { setEditing(null); setErr(""); setOpen(true); }}>
          <Plus className="h-4 w-4" />Tambah Jurusan
        </Button>
      </div>
      {majors.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <GraduationCap className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada jurusan. Default landing dipakai.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {majors.map((m) => (
            <div key={m.id} className="flex items-start justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">{m.code}</Badge>
                  <p className="font-semibold text-gray-900">{m.name}</p>
                </div>
                <p className="mt-1 text-sm text-gray-500">{m.description}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => { setEditing(m); setErr(""); setOpen(true); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => remove(m.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Tambah"} Jurusan</DialogTitle></DialogHeader>
          <form action={submit} className="space-y-4 pt-2">
            <div className="space-y-1.5"><Label>Kode</Label><Input name="code" defaultValue={editing?.code ?? ""} placeholder="TKJ" className="uppercase" required /></div>
            <div className="space-y-1.5"><Label>Nama Jurusan</Label><Input name="name" defaultValue={editing?.name ?? ""} required /></div>
            <div className="space-y-1.5"><Label>Deskripsi</Label><Textarea name="description" defaultValue={editing?.description ?? ""} rows={3} /></div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={pending}>Simpan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
