import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://43.133.134.10";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    "", "/tentang", "/jurusan", "/guru", "/ekstrakurikuler",
    "/galeri", "/berita", "/faq", "/kontak", "/ppdb", "/ppdb/status",
  ];
  return routes.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/berita" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/ppdb" ? 0.9 : 0.6,
  }));
}
