/**
 * Modul Landing — bentuk JSON untuk klien luar.
 *
 * Endpoint landing seluruhnya baru, jadi tidak ada bentuk lama yang harus
 * dipertahankan. Yang dipilih di sini: hanya kirim field yang memang dipakai
 * menampilkan konten, dan buang kolom internal seperti `isPublished` atau
 * `orderNumber` yang sudah tercermin dari urutan array.
 */

import type { getProfile, listFaq, listGallery, listNews, listStats } from "./content";
import type { findRegistration } from "./ppdb";

type Profile = Awaited<ReturnType<typeof getProfile>>;
type NewsItem = Awaited<ReturnType<typeof listNews>>[number];
type Stat = Awaited<ReturnType<typeof listStats>>[number];
type GalleryItem = Awaited<ReturnType<typeof listGallery>>[number];
type FaqItem = Awaited<ReturnType<typeof listFaq>>[number];
type Registration = NonNullable<Awaited<ReturnType<typeof findRegistration>>>;

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function toProfile(profile: Profile) {
  const p = profile as Record<string, unknown>;
  return {
    schoolName: text(p.schoolName) ?? "",
    shortName: text(p.shortName) ?? "",
    tagline: text(p.tagline),
    logoUrl: text(p.logoUrl),
    hero: {
      badge: text(p.heroBadge),
      title: text(p.heroTitle),
      subtitle: text(p.heroSubtitle),
    },
    contact: {
      address: text(p.address),
      phone: text(p.phone),
      whatsapp: text(p.whatsapp),
      email: text(p.email),
    },
    links: {
      official: text(p.officialUrl),
      instagram: text(p.instagram),
      facebook: text(p.facebook),
      youtube: text(p.youtube),
    },
    ppdbOpen: p.ppdbOpen === true,
  };
}

export function toStat(stat: Stat) {
  return { label: stat.label, value: stat.value };
}

export function toMajor(major: { code: string; name: string; description: string }) {
  return { code: major.code, name: major.name, description: major.description };
}

export function toNews(news: NewsItem) {
  return {
    slug: news.slug,
    title: news.title,
    excerpt: news.excerpt,
    imageUrl: news.imageUrl,
    publishedAt: news.publishedAt,
  };
}

/** Berita lengkap dengan isinya, untuk halaman detail. */
export function toNewsDetail(news: NewsItem) {
  return { ...toNews(news), content: news.content };
}

export function toGalleryItem(item: GalleryItem) {
  return { imageUrl: item.imageUrl, caption: item.caption };
}

export function toFaqItem(item: FaqItem) {
  return { question: item.question, answer: item.answer };
}

/**
 * Status pendaftaran. Data pribadi pendaftar sengaja tidak dikirim selain
 * nama — nomor pendaftaran bukan rahasia dan bisa ditebak, jadi endpoint ini
 * tidak boleh jadi jalan membocorkan alamat atau nomor telepon.
 */
export function toRegistrationStatus(registration: Registration) {
  return {
    registNumber: registration.registNumber,
    fullName: registration.fullName,
    selectedMajor: registration.selectedMajor ?? "-",
    status: registration.status,
    notes: registration.notes ?? "",
    createdAt: registration.createdAt,
  };
}
