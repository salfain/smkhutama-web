/**
 * Modul Landing - konten publik situs sekolah.
 *
 * Berbeda dengan tiga modul lain, bagian ini belum pernah punya API: halaman
 * publik mengambil datanya langsung lewat server component. Service ini jadi
 * sumber tunggal untuk keduanya - halaman web dan `/api/v1/landing/*` -
 * supaya situs dan API tidak pernah menampilkan isi yang berbeda.
 *
 * Semua fungsi di sini menerapkan **nilai bawaan** saat tabelnya masih kosong,
 * persis seperti yang sudah ditampilkan situs. Panel CMS sengaja TIDAK memakai
 * fungsi-fungsi ini: pengelola konten harus melihat apa yang benar-benar
 * tersimpan di basis data, bukan tampilan cadangannya.
 */

import { prisma } from "@/lib/prisma";
import { EXTRACURRICULARS, TEACHERS, type Extracurricular, type Teacher } from "@/lib/landing-static";

const DEFAULT_HERO_IMAGES = [
  "https://a1epuokipdvggoec.public.blob.vercel-storage.com/galler3-o5kwiisYRp4uvnXsCgLwwPTh33ciMD.jpg",
  "https://a1epuokipdvggoec.public.blob.vercel-storage.com/4_SARPRAS%20HUTAMA/IMG-20191119-WA0009-ncYutZ39aEgtGhqEvZoaqZ0Rcf4bZv.jpg",
  "https://a1epuokipdvggoec.public.blob.vercel-storage.com/3_GURU/WhatsApp%20Image%202025-05-17%20at%2013.40.06%20%281%29-VLkAsyBVKd8oQ0nXjhvThmgYezsmdl.jpeg",
];

const DEFAULT_PROFILE = {
  schoolName: "SMK Hutama Pondok Gede",
  shortName: "SMK Hutama",
  tagline: "Siap Kerja, Siap Kuliah, Siap Wirausaha",
  logoUrl:
    "https://a1epuokipdvggoec.public.blob.vercel-storage.com/SMK%20HUTAMA%20REDESIGN-1CH7729ODJDtWJl7q1Ko7lgaylTsFq.png",
  heroBadge: "SMK HUTAMA PONDOK GEDE",
  heroTitle:
    "Mempersiapkan generasi berkarakter, terampil, dan siap bersaing di dunia kerja maupun perguruan tinggi.",
  heroSubtitle:
    "Lingkungan belajar religius & disiplin dengan program keahlian unggulan dan kemitraan industri.",
  address: "Jl. Raya Hankam No.37, Jatirahayu, Pondok Melati, Kota Bekasi, Jawa Barat 17414",
  phone: "(021) 84990823",
  whatsapp: "+6283892950029",
  email: "info@smkhutama.sch.id",
  officialUrl: "https://smkhutama.sch.id",
  instagram: "https://www.instagram.com/smkhutamabekasi",
  facebook: null,
  youtube: null,
  ppdbOpen: true,
} as Record<string, unknown>;

const DEFAULT_STATS = [
  { id: "1", label: "Akreditasi", value: "A", orderNumber: 0 },
  { id: "2", label: "Program Keahlian", value: "6+", orderNumber: 1 },
  { id: "3", label: "Siswa Aktif", value: "1000+", orderNumber: 2 },
  { id: "4", label: "Mitra DU/DI", value: "20+", orderNumber: 3 },
];

const DEFAULT_MAJORS = [
  { id: "1", code: "TKRO", name: "Teknik Kendaraan Ringan Otomotif", description: "Perawatan & perbaikan kendaraan ringan standar industri.", orderNumber: 0, isActive: true },
  { id: "2", code: "TKJ", name: "Teknik Komputer dan Jaringan", description: "Jaringan, server, keamanan, dan infrastruktur IT.", orderNumber: 1, isActive: true },
  { id: "3", code: "PSPT", name: "Produksi & Siaran Program Televisi", description: "Broadcasting, produksi konten audio visual, media kreatif.", orderNumber: 2, isActive: true },
  { id: "4", code: "AKL", name: "Akuntansi dan Keuangan Lembaga", description: "Pembukuan, laporan keuangan, administrasi modern.", orderNumber: 3, isActive: true },
  { id: "5", code: "OTKP", name: "Otomatisasi & Tata Kelola Perkantoran", description: "Administrasi perkantoran & teknologi perkantoran.", orderNumber: 4, isActive: true },
];

const DEFAULT_VISION =
  "Menjadi sekolah menengah kejuruan unggulan yang menghasilkan lulusan berkarakter, kompeten, dan berdaya saing global.";

const DEFAULT_MISSION = [
  "Menyelenggarakan pendidikan vokasi yang religius dan disiplin.",
  "Membekali siswa dengan keterampilan sesuai kebutuhan industri.",
  "Membangun kemitraan dengan dunia usaha dan dunia industri (DU/DI).",
  "Mengembangkan karakter, kemandirian, dan jiwa wirausaha siswa.",
].join("\n");

/** Berita terbaru yang tampil di beranda. */
const HOME_NEWS_LIMIT = 6;

// ─── Profil & identitas ─────────────────────────────────────────────────────

export async function getProfile() {
  const profile = await prisma.landingProfile.findFirst();
  return profile ?? DEFAULT_PROFILE;
}

/** Visi, misi, sejarah, dan sambutan kepala sekolah. */
export async function getAbout() {
  const profile = await prisma.landingProfile.findFirst().catch(() => null);
  const mission = profile?.mission ?? DEFAULT_MISSION;

  return {
    vision: profile?.vision ?? DEFAULT_VISION,
    missionItems: mission
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    history: profile?.history ?? "",
    principalName: profile?.principalName ?? "",
    principalPhoto: profile?.principalPhoto ?? "",
    principalWord: profile?.principalWord ?? "",
  };
}

// ─── Beranda ────────────────────────────────────────────────────────────────

export async function listHeroImages() {
  const rows = await prisma.landingHeroImage.findMany({
    where: { isActive: true },
    orderBy: { orderNumber: "asc" },
  });
  if (rows.length > 0) return rows.map((h) => ({ imageUrl: h.imageUrl, caption: h.caption }));
  return DEFAULT_HERO_IMAGES.map((imageUrl) => ({ imageUrl, caption: null }));
}

export async function listStats() {
  const rows = await prisma.landingStat.findMany({ orderBy: { orderNumber: "asc" } });
  return rows.length > 0 ? rows : DEFAULT_STATS;
}

export async function listMajors() {
  const rows = await prisma.landingMajor.findMany({
    where: { isActive: true },
    orderBy: { orderNumber: "asc" },
  });
  return rows.length > 0 ? rows : DEFAULT_MAJORS;
}

/** Kode & nama jurusan untuk pilihan formulir PPDB. */
export async function getMajorOptions() {
  const majors = await listMajors();
  return majors.map((m) => ({ code: m.code, name: m.name }));
}

/**
 * Konten beranda dalam satu panggilan.
 * Bentuknya dipertahankan dari `src/lib/landing-data.ts` yang digantikannya.
 */
export async function getLandingContent() {
  const [profile, heroImages, stats, majors, news] = await Promise.all([
    getProfile(),
    listHeroImages(),
    listStats(),
    listMajors(),
    listNews({ take: HOME_NEWS_LIMIT }),
  ]);

  return { profile, heroImages, stats, majors, news };
}

// ─── Berita ─────────────────────────────────────────────────────────────────

export async function listNews(options: { take?: number } = {}) {
  return prisma.landingNews.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    take: options.take,
  });
}

export async function getNewsBySlug(slug: string) {
  const news = await prisma.landingNews.findUnique({ where: { slug } });
  if (!news || !news.isPublished) return null;
  return news;
}

/** Berita lain untuk ditampilkan di bawah satu artikel. */
export async function listRelatedNews(excludeSlug: string, take = 3) {
  return prisma.landingNews.findMany({
    where: { isPublished: true, slug: { not: excludeSlug } },
    orderBy: { publishedAt: "desc" },
    take,
  });
}

// ─── Guru, ekskul, galeri, FAQ ──────────────────────────────────────────────

export async function listTeachers(): Promise<Teacher[]> {
  const rows = await prisma.landingTeacher
    .findMany({ where: { isActive: true }, orderBy: { orderNumber: "asc" } })
    .catch(() => []);

  if (rows.length === 0) return TEACHERS;
  return rows.map((t) => ({
    name: t.name,
    position: t.position,
    subject: t.subject ?? "",
    photo: t.photoUrl,
  }));
}

export async function listExtracurriculars(): Promise<Extracurricular[]> {
  const rows = await prisma.landingExtracurricular
    .findMany({ where: { isActive: true }, orderBy: { orderNumber: "asc" } })
    .catch(() => []);

  if (rows.length === 0) return EXTRACURRICULARS;
  return rows.map((e) => ({
    name: e.name,
    category: e.category,
    description: e.description,
    schedule: e.schedule ?? "",
    icon: e.icon,
    color: e.color,
    image: e.imageUrl,
  }));
}

export async function listGallery() {
  return prisma.landingGallery
    .findMany({ where: { isActive: true }, orderBy: { orderNumber: "asc" } })
    .catch(() => []);
}

export async function listFaq() {
  return prisma.landingFaq
    .findMany({ where: { isActive: true }, orderBy: { orderNumber: "asc" } })
    .catch(() => []);
}
