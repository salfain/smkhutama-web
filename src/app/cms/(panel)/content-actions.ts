"use server";

import { prisma } from "@/lib/prisma";
import { requireCmsAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";

function revalidateLanding() {
  revalidatePath("/");
  revalidatePath("/ppdb");
}

// ---------- PROFILE ----------
export async function getProfile() {
  return prisma.landingProfile.findFirst();
}

export async function saveProfile(formData: FormData) {
  await requireCmsAuth();
  const data = {
    schoolName: String(formData.get("schoolName") ?? "").trim() || "SMK Hutama",
    shortName: String(formData.get("shortName") ?? "").trim() || "SMK Hutama",
    tagline: String(formData.get("tagline") ?? "").trim() || null,
    logoUrl: String(formData.get("logoUrl") ?? "").trim() || null,
    heroBadge: String(formData.get("heroBadge") ?? "").trim() || null,
    heroTitle: String(formData.get("heroTitle") ?? "").trim() || null,
    heroSubtitle: String(formData.get("heroSubtitle") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    officialUrl: String(formData.get("officialUrl") ?? "").trim() || null,
    instagram: String(formData.get("instagram") ?? "").trim() || null,
    ppdbOpen: formData.get("ppdbOpen") === "on",
  };
  try {
    const existing = await prisma.landingProfile.findFirst();
    if (existing) await prisma.landingProfile.update({ where: { id: existing.id }, data });
    else await prisma.landingProfile.create({ data });
    revalidateLanding();
    return { success: true };
  } catch {
    return { error: "Gagal menyimpan profil" };
  }
}

// ---------- HERO IMAGES ----------
export async function getHeroImages() {
  return prisma.landingHeroImage.findMany({ orderBy: { orderNumber: "asc" } });
}
export async function addHeroImage(formData: FormData) {
  await requireCmsAuth();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim();
  if (!imageUrl) return { error: "URL gambar wajib diisi" };
  const count = await prisma.landingHeroImage.count();
  await prisma.landingHeroImage.create({ data: { imageUrl, caption: caption || null, orderNumber: count } });
  revalidateLanding(); revalidatePath("/cms/hero-images");
  return { success: true };
}
export async function deleteHeroImage(id: string) {
  await requireCmsAuth();
  await prisma.landingHeroImage.delete({ where: { id } });
  revalidateLanding(); revalidatePath("/cms/hero-images");
  return { success: true };
}

// ---------- STATS ----------
export async function getStats() {
  return prisma.landingStat.findMany({ orderBy: { orderNumber: "asc" } });
}
export async function saveStat(formData: FormData) {
  await requireCmsAuth();
  const id = String(formData.get("id") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();
  if (!label || !value) return { error: "Label dan nilai wajib diisi" };
  if (id) await prisma.landingStat.update({ where: { id }, data: { label, value } });
  else {
    const count = await prisma.landingStat.count();
    await prisma.landingStat.create({ data: { label, value, orderNumber: count } });
  }
  revalidateLanding(); revalidatePath("/cms/stats");
  return { success: true };
}
export async function deleteStat(id: string) {
  await requireCmsAuth();
  await prisma.landingStat.delete({ where: { id } });
  revalidateLanding(); revalidatePath("/cms/stats");
  return { success: true };
}

// ---------- MAJORS ----------
export async function getMajors() {
  return prisma.landingMajor.findMany({ orderBy: { orderNumber: "asc" } });
}
export async function saveMajor(formData: FormData) {
  await requireCmsAuth();
  const id = String(formData.get("id") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!code || !name) return { error: "Kode dan nama jurusan wajib diisi" };
  if (id) await prisma.landingMajor.update({ where: { id }, data: { code, name, description } });
  else {
    const count = await prisma.landingMajor.count();
    await prisma.landingMajor.create({ data: { code, name, description, orderNumber: count } });
  }
  revalidateLanding(); revalidatePath("/cms/majors");
  return { success: true };
}
export async function deleteMajor(id: string) {
  await requireCmsAuth();
  await prisma.landingMajor.delete({ where: { id } });
  revalidateLanding(); revalidatePath("/cms/majors");
  return { success: true };
}

// ---------- NEWS ----------
export async function getNews() {
  return prisma.landingNews.findMany({ orderBy: { publishedAt: "desc" } });
}
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) + "-" + Math.floor(Math.random() * 1000);
}
export async function saveNews(formData: FormData) {
  await requireCmsAuth();
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const isPublished = formData.get("isPublished") === "on";
  if (!title || !excerpt) return { error: "Judul dan ringkasan wajib diisi" };
  const data = { title, excerpt, content: content || null, imageUrl: imageUrl || null, isPublished };
  if (id) await prisma.landingNews.update({ where: { id }, data });
  else await prisma.landingNews.create({ data: { ...data, slug: slugify(title) } });
  revalidateLanding(); revalidatePath("/cms/news");
  return { success: true };
}
export async function deleteNews(id: string) {
  await requireCmsAuth();
  await prisma.landingNews.delete({ where: { id } });
  revalidateLanding(); revalidatePath("/cms/news");
  return { success: true };
}

// ---------- REGISTRATIONS ----------
export async function getRegistrations() {
  return prisma.registration.findMany({ orderBy: { createdAt: "desc" } });
}
export async function updateRegistrationStatus(id: string, status: "PENDING" | "VERIFIED" | "ACCEPTED" | "REJECTED") {
  await requireCmsAuth();
  await prisma.registration.update({ where: { id }, data: { status } });
  revalidatePath("/cms/registrations");
  return { success: true };
}
export async function deleteRegistration(id: string) {
  await requireCmsAuth();
  await prisma.registration.delete({ where: { id } });
  revalidatePath("/cms/registrations");
  return { success: true };
}
