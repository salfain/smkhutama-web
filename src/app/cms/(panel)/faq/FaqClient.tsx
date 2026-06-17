"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, HelpCircle } from "lucide-react";
import { saveFaq, deleteFaq } from "../content-actions";
import { useConfirm } from "@/components/ConfirmDialog";

type Faq = { id: string; question: string; answer: string };

export function FaqClient({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function submit(fd: FormData) {
    setErr("");
    if (editing) fd.set("id", editing.id);
    startTransition(async () => {
      const r = await saveFaq(fd);
      if (r.error) setErr(r.error); else setOpen(false);
    });
  }
  async function remove(id: string) {
    if (!(await confirm("Hapus FAQ ini?"))) return;
    startTransition(async () => { await deleteFaq(id); });
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex justify-end">
        <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={() => { setEditing(null); setErr(""); setOpen(true); }}>
          <Plus className="h-4 w-4" />Tambah FAQ
        </Button>
      </div>

      {faqs.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <HelpCircle className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada FAQ.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((f) => (
            <div key={f.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{f.question}</p>
                  <p className="mt-1 text-sm text-gray-500">{f.answer}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => { setEditing(f); setErr(""); setOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => remove(f.id)}>
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
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Tambah"} FAQ</DialogTitle></DialogHeader>
          <form action={submit} className="space-y-4 pt-2">
            <div className="space-y-1.5"><Label>Pertanyaan *</Label><Input name="question" defaultValue={editing?.question ?? ""} placeholder="Kapan PPDB dibuka?" required /></div>
            <div className="space-y-1.5"><Label>Jawaban *</Label><Textarea name="answer" defaultValue={editing?.answer ?? ""} rows={4} placeholder="Jawaban lengkap..." required /></div>
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
