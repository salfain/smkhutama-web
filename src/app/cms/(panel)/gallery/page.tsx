import { getGallery } from "../content-actions";
import { GalleryClient } from "./GalleryClient";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const photos = await getGallery().catch(() => []);
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Galeri Foto</h1>
        <p className="text-sm text-gray-500">Kelola foto yang tampil di halaman /galeri</p>
      </div>
      <GalleryClient photos={photos.map((p) => ({ id: p.id, imageUrl: p.imageUrl, caption: p.caption ?? "" }))} />
    </div>
  );
}
