"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Newspaper } from "lucide-react";
import { saveNews, deleteNews } from "../content-actions";

type News = { id: string; title: string; excerpt: string; content: string | null; imageUrl: string | null; isPublished: boolean; publishedAt: string };

export function NewsClient({ news }: { news: News[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<News | null>(null);
  const [published, setPublished] = useState(true);
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();

  function openCreate() { setEditing(null); setPublished(true); setErr(""); setOpen(true); }
  function openEdit(n: News) { setEditing(n); setPublished(n.isPublished); setErr(""); setOpen(true); }

  function submit(fd: FormData) {
    setErr("");
    if (editing) fd.set("id", editing.id);
    if (published) fd.set("isPublished", "on"); else fd.delete("isPublished");
    startTransition(async () => {
      const r = await saveNews(fd);
      if (r.error) setErr(r.error); else setOpen(false);
    });
  }
  function remove(id: string) {
    if (!confirm("Hapus berita ini?")) return;
    startTransition(async () => { await deleteNews(id); });
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex justify-end">
        <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={openCreate}>
          <Plus className="h-4 w-4" />Tambah Berita
        </Button>
      </div>
      {news.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <Newspaper className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada berita.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {news.map((n) => (
            <div key={n.id} className="flex items-start justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{n.title}</p>
                  <Badge className={n.isPublished ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100"}>
                    {n.isPublished ? "Terbit" : "Draft"}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">{n.excerpt}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => openEdit(n)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => remove(n.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Tambah"} Berita</DialogTitle></DialogHeader>
          <form action={submit} className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-1.5"><Label>Judul</Label><Input name="title" defaultValue={editing?.title ?? ""} required /></div>
            <div className="space-y-1.5"><Label>Ringkasan</Label><Textarea name="excerpt" defaultValue={editing?.excerpt ?? ""} rows={2} required /></div>
            <div className="space-y-1.5"><Label>Isi Lengkap (opsional)</Label><Textarea name="content" defaultValue={editing?.content ?? ""} rows={4} /></div>
            <div className="space-y-1.5"><Label>URL Gambar (opsional)</Label><Input name="imageUrl" defaultValue={editing?.imageUrl ?? ""} placeholder="https://..." /></div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Terbitkan (tampil di beranda)</span>
            </label>
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
