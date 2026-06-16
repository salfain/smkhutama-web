import { getHeroImages } from "../content-actions";
import { HeroImagesClient } from "./HeroImagesClient";

export const dynamic = "force-dynamic";

export default async function HeroImagesPage() {
  const images = await getHeroImages().catch(() => []);
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Gambar Hero</h1>
        <p className="text-sm text-gray-500">Carousel gambar di banner utama beranda</p>
      </div>
      <HeroImagesClient images={images.map((i) => ({ id: i.id, imageUrl: i.imageUrl, caption: i.caption }))} />
    </div>
  );
}
