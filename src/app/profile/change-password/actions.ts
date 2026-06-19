"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function changePasswordAction(formData: FormData) {
  const user = await getSession();
  if (!user) return { error: "Sesi telah berakhir, silakan login kembali." };

  const currentPassword = String(formData.get("currentPassword") ?? "").trim();
  const newPassword = String(formData.get("newPassword") ?? "").trim();
  const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Semua bidang wajib diisi." };
  }

  if (newPassword.length < 6) {
    return { error: "Password baru minimal 6 karakter." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Konfirmasi password baru tidak cocok." };
  }

  try {
    // Validasi password lama
    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      return { error: "Password saat ini salah." };
    }

    // Hash password baru
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update di DB
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { success: true };
  } catch (err: any) {
    console.error("Gagal ganti password:", err);
    return { error: "Terjadi kesalahan sistem." };
  }
}
