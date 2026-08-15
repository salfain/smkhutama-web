import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SMK HUTAMA — Portal Akademik",
    short_name: "SMK Hutama",
    description:
      "Portal Akademik resmi SMK Hutama Pondok Gede. Akses informasi sekolah, PPDB, dan layanan digital terpadu.",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    lang: "id",
    background_color: "#ffffff",
    theme_color: "#003a9e",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
