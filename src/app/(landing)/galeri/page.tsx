import { prisma } from "@/lib/prisma";
import { Images } from "lucide-react";
import { PageHero } from "@/components/landing/PageHero";
import { RevealContainer, RevealCard } from "@/components/landing/Reveal";

export const dynamic = "force-dynamic";

export const metadata = { title: "Galeri – SMK Hutama" };

export default async function GaleriPage() {
  const photos = await prisma.landingGallery
    .findMany({ where: { isActive: true }, orderBy: { orderNumber: "asc" } })
    .catch(() => []);

  return (
    <>
      <PageHero
        icon={Images}
        title="Galeri Kegiatan"
        subtitle="Dokumentasi kegiatan belajar, prestasi, dan momen kebersamaan di SMK Hutama."
      />

      <section className="bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-16">
          {photos.length === 0 ? (
            <p className="text-center text-slate-400">Belum ada foto galeri.</p>
          ) : (
            <RevealContainer className="columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
              {photos.map((p) => (
                <RevealCard key={p.id}>
                  <figure className="group relative overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm break-inside-avoid">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageUrl} alt={p.caption ?? "Galeri SMK Hutama"} className="w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                    {p.caption && (
                      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {p.caption}
                      </figcaption>
                    )}
                  </figure>
                </RevealCard>
              ))}
            </RevealContainer>
          )}
        </div>
      </section>
    </>
  );
}
