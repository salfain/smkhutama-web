"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

export async function getSchoolProfile() {
  return prisma.schoolProfile.findFirst();
}

export async function upsertSchoolProfile(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const npsn = String(formData.get("npsn") ?? "").trim();
  const principalName = String(formData.get("principalName") ?? "").trim();
  const letterhead = String(formData.get("letterhead") ?? "").trim();

  if (!name) return { error: "Nama sekolah wajib diisi" };

  const logoFile = formData.get("logo") as File | null;
  let logoPath: string | undefined;

  if (logoFile && logoFile.size > 0) {
    if (logoFile.size > 500 * 1024) return { error: "Ukuran logo maks 500KB" };
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(logoFile.type)) return { error: "Format logo harus PNG/JPG/WEBP" };

    const uploadDir = path.join(process.cwd(), "public", "uploads", "school");
    await mkdir(uploadDir, { recursive: true });
    const ext = logoFile.name.split(".").pop() ?? "png";
    const fileName = `logo.${ext}`;
    const bytes = await logoFile.arrayBuffer();
    await writeFile(path.join(uploadDir, fileName), Buffer.from(bytes));
    logoPath = `/uploads/school/${fileName}`;
  }

  try {
    const existing = await prisma.schoolProfile.findFirst();
    const data = {
      name,
      address: address || null,
      npsn: npsn || null,
      principalName: principalName || null,
      letterhead: letterhead || null,
      ...(logoPath && { logo: logoPath }),
    };

    if (existing) {
      await prisma.schoolProfile.update({ where: { id: existing.id }, data });
    } else {
      await prisma.schoolProfile.create({ data });
    }

    revalidatePath("/admin/school-profile");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch {
    return { error: "Gagal menyimpan profil sekolah" };
  }
}
