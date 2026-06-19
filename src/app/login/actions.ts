"use server";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { setSession, clearSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";

type LoginResult =
  | { error: string }
  | { success: true; redirectTo: string };

export async function loginAction(
  username: string,
  password: string,
  expectedRole: "ADMIN" | "TEACHER" | "STUDENT" | "COUNSELOR" | "PIKET"
): Promise<LoginResult> {
  if (!username || !password) return { error: "Username dan password wajib diisi." };

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return { error: "Username atau password salah." };
    if (!user.isActive) return { error: "Akun Anda nonaktif. Hubungi admin." };
    if (user.role !== expectedRole) {
      return { error: `Akun ini bukan akun ${expectedRole.toLowerCase()}.` };
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return { error: "Username atau password salah." };

    await setSession(user.id);
    await logAudit({
      userId: user.id,
      action: "LOGIN_SUCCESS",
      entity: "auth",
      entityId: user.id,
      details: { username: user.username, role: user.role },
    });

    const redirectTo =
      user.role === "ADMIN"
        ? "/admin/dashboard"
        : user.role === "TEACHER"
        ? "/teacher/dashboard"
        : user.role === "COUNSELOR"
        ? "/counselor/dashboard"
        : user.role === "PIKET"
        ? "/piket/dashboard"
        : "/student/dashboard";

    return { success: true, redirectTo };
  } catch {
    return { error: "Terjadi kesalahan. Periksa koneksi database." };
  }
}

export async function logoutAction() {
  await logAudit({ action: "LOGOUT", entity: "auth" });
  await clearSession();
  redirect("/login");
}
