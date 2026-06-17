"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ImageOff } from "lucide-react";
import { addGalleryImage, deleteGalleryImage } from "../content-actions";
import { useConfirm } from "@/components/ConfirmDialog";

type Photo = { id: string; imageUrl: string; caption: string };

export function GalleryClient({ photos }: { photos: Photo[] }) {
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function add(fd: FormData) {
    setErr("");
    startTransition(async () => {
      const r = await addGalleryImage(fd);
      if (r.error) setErr(r.error);
    });
  }
  async function remove(id: string) {
    if (!(await confirm("Hapus foto ini dari galeri?"))) return;
    startTransition(async () => { await deleteGalleryImage(id); });
  }

  return (
    <div className="max-w-4xl">
      <form action={add} className="mb-6 flex flex-col gap-2 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5"><Label>URL Gambar *</Label><Input name="imageUrl" placeholder="https://..." required /></div>
        <div className="flex-1 space-y-1.5"><Label>Caption</Label><Input name="caption" placeholder="Keterangan foto (opsional)" /></div>
        <Button type="submit" className="gap-1.5 bg-blue-600 hover:bg-blue-700" disabled={pending}><Plus className="h-4 w-4" />Tambah</Button>
      </form>
      {err && <p className="mb-3 text-sm text-red-600">{err}</p>}

      {photos.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
          <ImageOff className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada foto galeri.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="group relative overflow-hidden rounded-xl border bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imageUrl} alt={p.caption} className="h-32 w-full object-cover" />
              {p.caption && <p className="truncate px-2 py-1.5 text-xs text-gray-600">{p.caption}</p>}
              <button onClick={() => remove(p.id)} className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-red-500 opacity-0 shadow transition-opacity group-hover:opacity-100">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
