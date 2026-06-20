"use server";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { setSession, clearSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { getPiketDayName, isTeacherScheduledForPiket, getJakartaDayOfWeek } from "@/lib/piket-schedule";
import { redirect } from "next/navigation";

type LoginResult =
  | { error: string }
  | { success: true; redirectTo: string };

export async function loginAction(
  username: string,
  password: string,
  expectedRole: "ADMIN" | "TEACHER" | "STUDENT" | "COUNSELOR" | "PIKET",
  system?: "CBT" | "SIBIKONS" | "PIKET"
): Promise<LoginResult> {
  if (!username || !password) return { error: "Username dan password wajib diisi." };

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { teacher: true },
    });
    if (!user) return { error: "Username atau password salah." };
    if (!user.isActive) return { error: "Akun Anda nonaktif. Hubungi admin." };
    if (user.role !== expectedRole) {
      return { error: `Akun ini bukan akun ${expectedRole.toLowerCase()}.` };
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return { error: "Username atau password salah." };

    if (system === "PIKET") {
      if (user.role !== "TEACHER" || !user.teacher) {
        return { error: "Login piket menggunakan akun guru." };
      }

      const scheduled = await isTeacherScheduledForPiket(user.teacher.id);
      if (!scheduled) {
        const today = getPiketDayName(getJakartaDayOfWeek());
        return { error: `Anda tidak terjadwal piket hari ${today}. Hubungi admin jika jadwal belum diatur.` };
      }
    }

    await setSession(user.id);
    await logAudit({
      userId: user.id,
      action: "LOGIN_SUCCESS",
      entity: "auth",
      entityId: user.id,
      details: { username: user.username, role: user.role },
    });

    const redirectTo =
      system === "PIKET"
        ? "/piket/dashboard"
        : user.role === "ADMIN"
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
