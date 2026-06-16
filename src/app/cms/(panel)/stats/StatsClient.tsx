"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { saveStat, deleteStat } from "../content-actions";
import { useConfirm } from "@/components/ConfirmDialog";

type Stat = { id: string; label: string; value: string };

export function StatsClient({ stats }: { stats: Stat[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Stat | null>(null);
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function submit(fd: FormData) {
    setErr("");
    if (editing) fd.set("id", editing.id);
    startTransition(async () => {
      const r = await saveStat(fd);
      if (r.error) setErr(r.error); else setOpen(false);
    });
  }
  async function remove(id: string) {
    if (!(await confirm("Hapus statistik ini?"))) return;
    startTransition(async () => { await deleteStat(id); });
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex justify-end">
        <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={() => { setEditing(null); setErr(""); setOpen(true); }}>
          <Plus className="h-4 w-4" />Tambah Statistik
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {stats.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
            <div>
              <p className="font-heading text-2xl font-bold text-blue-700">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => { setEditing(s); setErr(""); setOpen(true); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => remove(s.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Tambah"} Statistik</DialogTitle></DialogHeader>
          <form action={submit} className="space-y-4 pt-2">
            <div className="space-y-1.5"><Label>Nilai</Label><Input name="value" defaultValue={editing?.value ?? ""} placeholder="A / 1000+ / 6" required /></div>
            <div className="space-y-1.5"><Label>Label</Label><Input name="label" defaultValue={editing?.label ?? ""} placeholder="Akreditasi" required /></div>
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
