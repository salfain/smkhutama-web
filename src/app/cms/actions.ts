"use server";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { setSession, clearSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function cmsLogin(username: string, password: string) {
  if (!username || !password) return { error: "Username dan password wajib diisi." };
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return { error: "Username atau password salah." };
    if (!user.isActive) return { error: "Akun nonaktif." };
    if (user.role !== "LANDING_ADMIN" && user.role !== "ADMIN") {
      return { error: "Akun ini tidak punya akses CMS." };
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return { error: "Username atau password salah." };
    await setSession(user.id);
    return { success: true };
  } catch {
    return { error: "Terjadi kesalahan koneksi database." };
  }
}

export async function cmsLogout() {
  await clearSession();
  redirect("/cms/login");
}
