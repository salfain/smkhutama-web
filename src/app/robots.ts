import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://43.133.134.10";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Halaman privat/aplikasi tidak perlu di-index
        disallow: ["/admin", "/teacher", "/student", "/counselor", "/cms", "/api"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
