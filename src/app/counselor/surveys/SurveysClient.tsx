"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ClipboardList, Settings2 } from "lucide-react";
import { saveSurvey, deleteSurvey } from "../survey-actions";

type Survey = { id: string; title: string; description: string; isActive: boolean; questionCount: number; responseCount: number };

export function SurveysClient({ surveys }: { surveys: Survey[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Survey | null>(null);
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(fd: FormData) {
    setErr("");
    if (editing) fd.set("id", editing.id);
    startTransition(async () => {
      const r = await saveSurvey(fd);
      if (r.error) setErr(r.error); else setOpen(false);
    });
  }
  function remove(id: string) {
    if (!confirm("Hapus angket ini beserta semua jawabannya?")) return;
    startTransition(async () => { await deleteSurvey(id); });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" className="gap-1.5 bg-purple-600 hover:bg-purple-700" onClick={() => { setEditing(null); setErr(""); setOpen(true); }}>
          <Plus className="h-4 w-4" />Buat Angket
        </Button>
      </div>

      {surveys.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <ClipboardList className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada angket.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {surveys.map((s) => (
            <div key={s.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{s.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {s.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  {s.description && <p className="mt-1 text-xs text-gray-500 line-clamp-2">{s.description}</p>}
                  <p className="mt-2 text-xs text-gray-400">{s.questionCount} pertanyaan · {s.responseCount} responden</p>
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-1">
                <Link href={`/counselor/surveys/${s.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5"><Settings2 className="h-3.5 w-3.5" />Kelola & Hasil</Button>
                </Link>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600 hover:bg-purple-50" onClick={() => { setEditing(s); setErr(""); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => remove(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Buat"} Angket</DialogTitle></DialogHeader>
          <form action={submit} className="space-y-4 pt-2">
            <div className="space-y-1.5"><Label>Judul *</Label><Input name="title" defaultValue={editing?.title ?? ""} placeholder="Angket Kebutuhan Peserta Didik (AKPD)" required /></div>
            <div className="space-y-1.5"><Label>Deskripsi</Label><Textarea name="description" defaultValue={editing?.description ?? ""} rows={3} placeholder="Penjelasan singkat angket" /></div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="isActive" defaultChecked={editing ? editing.isActive : true} className="h-4 w-4 rounded border-gray-300" />
              Aktif (bisa diisi siswa)
            </label>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={pending}>Simpan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
