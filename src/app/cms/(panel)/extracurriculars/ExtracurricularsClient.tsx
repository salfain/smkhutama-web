"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { saveExtracurricular, deleteExtracurricular } from "../content-actions";
import { useConfirm } from "@/components/ConfirmDialog";

type Ekskul = {
  id: string; name: string; category: string; description: string;
  schedule: string; icon: string; color: string; imageUrl: string;
};

const ICON_OPTIONS = ["Sparkles", "Tent", "Trophy", "Volleyball", "Flag", "Moon", "Languages", "Music", "HeartPulse"];
const COLOR_OPTIONS = [
  { label: "Biru", value: "from-blue-500 to-indigo-600" },
  { label: "Hijau", value: "from-green-500 to-emerald-600" },
  { label: "Oranye", value: "from-sky-500 to-blue-600" },
  { label: "Merah", value: "from-red-500 to-rose-600" },
  { label: "Ungu", value: "from-purple-500 to-fuchsia-600" },
  { label: "Pink", value: "from-pink-500 to-rose-600" },
  { label: "Teal", value: "from-teal-500 to-cyan-600" },
];

export function ExtracurricularsClient({ items }: { items: Ekskul[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ekskul | null>(null);
  const [icon, setIcon] = useState("Sparkles");
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function openCreate() {
    setEditing(null); setIcon("Sparkles"); setColor(COLOR_OPTIONS[0].value); setErr(""); setOpen(true);
  }
  function openEdit(e: Ekskul) {
    setEditing(e); setIcon(e.icon || "Sparkles"); setColor(e.color || COLOR_OPTIONS[0].value); setErr(""); setOpen(true);
  }
  function submit(fd: FormData) {
    setErr("");
    if (editing) fd.set("id", editing.id);
    fd.set("icon", icon);
    fd.set("color", color);
    startTransition(async () => {
      const r = await saveExtracurricular(fd);
      if (r.error) setErr(r.error); else setOpen(false);
    });
  }
  async function remove(id: string) {
    if (!(await confirm("Hapus ekstrakurikuler ini?"))) return;
    startTransition(async () => { await deleteExtracurricular(id); });
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-4 flex justify-end">
        <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={openCreate}>
          <Plus className="h-4 w-4" />Tambah Ekstrakurikuler
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <Sparkles className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada ekstrakurikuler.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((e) => (
            <div key={e.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className={`relative h-24 bg-gradient-to-br ${e.color}`}>
                {e.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.imageUrl} alt={e.name} className="h-full w-full object-cover opacity-80" />
                )}
                <Badge className="absolute left-2 top-2 bg-white/90 text-slate-700 border-0 hover:bg-white">{e.category}</Badge>
              </div>
              <div className="p-4">
                <p className="font-semibold text-gray-900">{e.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">{e.description}</p>
                {e.schedule && <p className="mt-2 text-xs text-blue-600">{e.schedule}</p>}
                <div className="mt-3 flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => openEdit(e)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => remove(e.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Tambah"} Ekstrakurikuler</DialogTitle></DialogHeader>
          <form action={submit} className="space-y-4 pt-2">
            <div className="space-y-1.5"><Label>Nama *</Label><Input name="name" defaultValue={editing?.name ?? ""} placeholder="Pramuka" required /></div>
            <div className="space-y-1.5"><Label>Kategori *</Label><Input name="category" defaultValue={editing?.category ?? ""} placeholder="Wajib / Olahraga / Seni" required /></div>
            <div className="space-y-1.5"><Label>Deskripsi</Label><Textarea name="description" defaultValue={editing?.description ?? ""} rows={3} placeholder="Deskripsi singkat kegiatan" /></div>
            <div className="space-y-1.5"><Label>Jadwal</Label><Input name="schedule" defaultValue={editing?.schedule ?? ""} placeholder="Jumat, 14:00 – 16:00" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ikon</Label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Warna</Label>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>URL Gambar</Label><Input name="imageUrl" defaultValue={editing?.imageUrl ?? ""} placeholder="https://..." /></div>
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
