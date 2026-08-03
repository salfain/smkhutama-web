"use server";

/**
 * Server action halaman login web.
 *
 * Aturan kredensialnya dipinjam dari `@/server/modules/auth/service` — sumber
 * yang sama dengan `/api/v1/auth/login` — supaya login lewat browser dan lewat
 * aplikasi mobile tidak bisa berbeda syarat. Yang khas web tinggal di sini:
 * saklar login siswa, cookie sesi, dan tujuan pengalihan setelah masuk.
 */

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { clearSession, setSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { checkCredentials, type CredentialFailure } from "@/server/modules/auth/service";

type Role =
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "COUNSELOR"
  | "PIKET"
  | "KURIKULUM"
  | "KESISWAAN"
  | "ADMIN_CBT";
type System = "CBT" | "SIBIKONS" | "PIKET";

type LoginResult = { error: string } | { success: true; redirectTo: string };

/** Kalimat versi web — diakhiri titik, berbeda dari kalimat API. */
function messageFor(reason: CredentialFailure, role: Role, today?: string) {
  switch (reason) {
    case "MISSING_FIELDS":
      return "Username dan password wajib diisi.";
    case "ACCOUNT_INACTIVE":
      return "Akun Anda nonaktif. Hubungi admin.";
    case "ROLE_MISMATCH":
      return `Akun ini bukan akun ${role.toLowerCase()}.`;
    case "PIKET_REQUIRES_TEACHER":
      return "Login piket menggunakan akun guru.";
    case "PIKET_NOT_SCHEDULED":
      return `Anda tidak terjadwal piket hari ${today}. Hubungi admin jika jadwal belum diatur.`;
    default:
      return "Username atau password salah.";
  }
}

function destinationFor(role: string, system?: System) {
  if (system === "PIKET") return "/piket/dashboard";
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "KURIKULUM") return "/admin/dashboard";
  if (role === "KESISWAAN") return "/admin/dashboard";
  if (role === "ADMIN_CBT") return "/admin/dashboard";
  if (role === "TEACHER") return "/teacher/dashboard";
  if (role === "COUNSELOR") return "/counselor/dashboard";
  if (role === "PIKET") return "/piket/dashboard";
  return "/student/dashboard";
}

export async function getStudentWebLoginEnabled() {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "allow_student_web_login" },
    select: { value: true },
  });
  return setting?.value === "true";
}

export async function loginAction(
  username: string,
  password: string,
  expectedRole: Role,
  system?: System
): Promise<LoginResult> {
  try {
    const result = await checkCredentials({ username, password, role: expectedRole, system });
    if (!result.ok) {
      return { error: messageFor(result.reason, expectedRole, result.today) };
    }

    const user = result.user!;

    // Aturan khusus web: siswa bisa dilarang masuk lewat browser.
    if (user.role === "STUDENT" && !(await getStudentWebLoginEnabled())) {
      return {
        error:
          "Login siswa melalui website sedang dinonaktifkan. Silakan gunakan aplikasi mobile.",
      };
    }

    await setSession(user.id);
    await logAudit({
      userId: user.id,
      action: "LOGIN_SUCCESS",
      entity: "auth",
      entityId: user.id,
      details: { username: user.username, role: user.role },
    });

    return { success: true, redirectTo: destinationFor(user.role, system) };
  } catch {
    return { error: "Terjadi kesalahan. Periksa koneksi database." };
  }
}

export async function logoutAction() {
  await logAudit({ action: "LOGOUT", entity: "auth" });
  await clearSession();
  redirect("/login");
}
