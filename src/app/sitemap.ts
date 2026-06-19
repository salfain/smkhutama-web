import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://smkhutama.web.id";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    { path: "",              freq: "weekly",  priority: 1.0 },
    { path: "/tentang",      freq: "monthly", priority: 0.8 },
    { path: "/jurusan",      freq: "monthly", priority: 0.8 },
    { path: "/guru",         freq: "monthly", priority: 0.7 },
    { path: "/ekstrakurikuler", freq: "monthly", priority: 0.7 },
    { path: "/galeri",       freq: "monthly", priority: 0.6 },
    { path: "/berita",       freq: "weekly",  priority: 0.9 },
    { path: "/faq",          freq: "monthly", priority: 0.6 },
    { path: "/kontak",       freq: "monthly", priority: 0.6 },
    { path: "/ppdb",         freq: "weekly",  priority: 0.9 },
    { path: "/ppdb/status",  freq: "monthly", priority: 0.5 },
  ] as const;

  return routes.map(({ path, freq, priority }) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: freq,
    priority,
  }));
}
