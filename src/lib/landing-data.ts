import { prisma } from "./prisma";

const DEFAULT_HERO_IMAGES = [
  "https://a1epuokipdvggoec.public.blob.vercel-storage.com/galler3-o5kwiisYRp4uvnXsCgLwwPTh33ciMD.jpg",
  "https://a1epuokipdvggoec.public.blob.vercel-storage.com/4_SARPRAS%20HUTAMA/IMG-20191119-WA0009-ncYutZ39aEgtGhqEvZoaqZ0Rcf4bZv.jpg",
  "https://a1epuokipdvggoec.public.blob.vercel-storage.com/3_GURU/WhatsApp%20Image%202025-05-17%20at%2013.40.06%20%281%29-VLkAsyBVKd8oQ0nXjhvThmgYezsmdl.jpeg",
];

export async function getLandingContent() {
  const [profile, heroImages, stats, majors, news] = await Promise.all([
    prisma.landingProfile.findFirst(),
    prisma.landingHeroImage.findMany({ where: { isActive: true }, orderBy: { orderNumber: "asc" } }),
    prisma.landingStat.findMany({ orderBy: { orderNumber: "asc" } }),
    prisma.landingMajor.findMany({ where: { isActive: true }, orderBy: { orderNumber: "asc" } }),
    prisma.landingNews.findMany({ where: { isPublished: true }, orderBy: { publishedAt: "desc" }, take: 6 }),
  ]);

  return {
    profile: profile ?? {
      schoolName: "SMK Hutama Pondok Gede",
      shortName: "SMK Hutama",
      tagline: "Siap Kerja, Siap Kuliah, Siap Wirausaha",
      logoUrl: "https://a1epuokipdvggoec.public.blob.vercel-storage.com/SMK%20HUTAMA%20REDESIGN-1CH7729ODJDtWJl7q1Ko7lgaylTsFq.png",
      heroBadge: "SMK HUTAMA PONDOK GEDE",
      heroTitle: "Mempersiapkan generasi berkarakter, terampil, dan siap bersaing di dunia kerja maupun perguruan tinggi.",
      heroSubtitle: "Lingkungan belajar religius & disiplin dengan program keahlian unggulan dan kemitraan industri.",
      address: "Jl. Raya Hankam No.37, Jatirahayu, Pondok Melati, Kota Bekasi, Jawa Barat 17414",
      phone: "(021) 84990823",
      whatsapp: "+6283892950029",
      email: "info@smkhutama.sch.id",
      officialUrl: "https://smkhutama.sch.id",
      instagram: "https://www.instagram.com/smkhutamabekasi",
      facebook: null,
      youtube: null,
      ppdbOpen: true,
    } as Record<string, unknown>,
    heroImages: heroImages.length > 0 ? heroImages.map((h) => ({ imageUrl: h.imageUrl, caption: h.caption })) : DEFAULT_HERO_IMAGES.map((src) => ({ imageUrl: src, caption: null })),
    stats: stats.length > 0 ? stats : [
      { id: "1", label: "Akreditasi", value: "A", orderNumber: 0 },
      { id: "2", label: "Program Keahlian", value: "6+", orderNumber: 1 },
      { id: "3", label: "Siswa Aktif", value: "1000+", orderNumber: 2 },
      { id: "4", label: "Mitra DU/DI", value: "20+", orderNumber: 3 },
    ],
    majors: majors.length > 0 ? majors : [
      { id: "1", code: "TKRO", name: "Teknik Kendaraan Ringan Otomotif", description: "Perawatan & perbaikan kendaraan ringan standar industri.", orderNumber: 0, isActive: true },
      { id: "2", code: "TKJ", name: "Teknik Komputer dan Jaringan", description: "Jaringan, server, keamanan, dan infrastruktur IT.", orderNumber: 1, isActive: true },
      { id: "3", code: "PSPT", name: "Produksi & Siaran Program Televisi", description: "Broadcasting, produksi konten audio visual, media kreatif.", orderNumber: 2, isActive: true },
      { id: "4", code: "AKL", name: "Akuntansi dan Keuangan Lembaga", description: "Pembukuan, laporan keuangan, administrasi modern.", orderNumber: 3, isActive: true },
      { id: "5", code: "OTKP", name: "Otomatisasi & Tata Kelola Perkantoran", description: "Administrasi perkantoran & teknologi perkantoran.", orderNumber: 4, isActive: true },
    ],
    news,
  };
}

export async function getMajorOptions() {
  const majors = await prisma.landingMajor.findMany({ where: { isActive: true }, orderBy: { orderNumber: "asc" } });
  if (majors.length > 0) return majors.map((m) => ({ code: m.code, name: m.name }));
  return [
    { code: "TKRO", name: "Teknik Kendaraan Ringan Otomotif" },
    { code: "TKJ", name: "Teknik Komputer dan Jaringan" },
    { code: "PSPT", name: "Produksi & Siaran Program Televisi" },
    { code: "AKL", name: "Akuntansi dan Keuangan Lembaga" },
    { code: "OTKP", name: "Otomatisasi & Tata Kelola Perkantoran" },
  ];
}
