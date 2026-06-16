"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, UserCog } from "lucide-react";
import { saveTeacher, deleteTeacher } from "../content-actions";

type Teacher = { id: string; name: string; position: string; subject: string; photoUrl: string };

export function TeachersClient({ teachers }: { teachers: Teacher[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(fd: FormData) {
    setErr("");
    if (editing) fd.set("id", editing.id);
    startTransition(async () => {
      const r = await saveTeacher(fd);
      if (r.error) setErr(r.error); else setOpen(false);
    });
  }
  function remove(id: string) {
    if (!confirm("Hapus data guru ini?")) return;
    startTransition(async () => { await deleteTeacher(id); });
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex justify-end">
        <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={() => { setEditing(null); setErr(""); setOpen(true); }}>
          <Plus className="h-4 w-4" />Tambah Guru
        </Button>
      </div>
      {teachers.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <UserCog className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada data guru.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {teachers.map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3 min-w-0">
                {t.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.photoUrl} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {t.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{t.name}</p>
                  <Badge className="mt-1 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">{t.position}</Badge>
                  {t.subject && <p className="mt-1 text-xs text-gray-500">{t.subject}</p>}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => { setEditing(t); setErr(""); setOpen(true); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => remove(t.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Tambah"} Guru</DialogTitle></DialogHeader>
          <form action={submit} className="space-y-4 pt-2">
            <div className="space-y-1.5"><Label>Nama Lengkap *</Label><Input name="name" defaultValue={editing?.name ?? ""} placeholder="Nama beserta gelar" required /></div>
            <div className="space-y-1.5"><Label>Jabatan *</Label><Input name="position" defaultValue={editing?.position ?? ""} placeholder="Guru / Kepala Sekolah" required /></div>
            <div className="space-y-1.5"><Label>Mata Pelajaran</Label><Input name="subject" defaultValue={editing?.subject ?? ""} placeholder="Matematika" /></div>
            <div className="space-y-1.5"><Label>URL Foto</Label><Input name="photoUrl" defaultValue={editing?.photoUrl ?? ""} placeholder="https://..." /></div>
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
