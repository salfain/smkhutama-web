"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, ImageOff } from "lucide-react";
import { addHeroImage, deleteHeroImage } from "../content-actions";

type Img = { id: string; imageUrl: string; caption: string | null };

export function HeroImagesClient({ images }: { images: Img[] }) {
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();

  function add(fd: FormData) {
    setErr("");
    startTransition(async () => {
      const r = await addHeroImage(fd);
      if (r.error) setErr(r.error);
    });
  }
  function remove(id: string) {
    if (!confirm("Hapus gambar ini?")) return;
    startTransition(async () => { await deleteHeroImage(id); });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <form action={add} className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <p className="font-semibold text-gray-700">Tambah Gambar Hero</p>
        <div className="space-y-1.5"><Label>URL Gambar *</Label><Input name="imageUrl" placeholder="https://..." required /></div>
        <div className="space-y-1.5"><Label>Caption (opsional)</Label><Input name="caption" placeholder="Deskripsi gambar" /></div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <Button type="submit" className="gap-1.5 bg-blue-600 hover:bg-blue-700" disabled={pending}>
          <Plus className="h-4 w-4" />Tambah Gambar
        </Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        {images.length === 0 ? (
          <div className="col-span-full rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
            <ImageOff className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">Belum ada gambar. Gunakan default landing.</p>
          </div>
        ) : images.map((img) => (
          <div key={img.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.imageUrl} alt={img.caption ?? ""} className="h-40 w-full object-cover" />
            <div className="flex items-center justify-between p-3">
              <p className="truncate text-xs text-gray-500">{img.caption ?? "Tanpa caption"}</p>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => remove(img.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
