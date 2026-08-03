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
import { portals, suggestedPortal, type Portal, type Role, type System } from "./portals";

type LoginResult = { error: string } | { success: true; redirectTo: string; role: Role };

/** Kalimat versi web — diakhiri titik, berbeda dari kalimat API. */
function messageFor(reason: CredentialFailure, today?: string) {
  switch (reason) {
    case "MISSING_FIELDS":
      return "Username dan password wajib diisi.";
    case "ACCOUNT_INACTIVE":
      return "Akun Anda nonaktif. Hubungi admin.";
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

/**
 * Pesan untuk akun yang benar tapi membuka pintu yang salah.
 *
 * Password-nya sudah terbukti pada titik ini, jadi menunjukkan pintu yang tepat
 * tidak membocorkan apa pun yang belum diketahui pemilik akun — dan jauh lebih
 * berguna daripada sekadar "akses ditolak".
 */
function wrongPortalMessage(role: Role, portal: Portal) {
  const suggestion = suggestedPortal(role);
  const opened = portals[portal].title;
  if (!suggestion || suggestion === portal) {
    return `Akun ini tidak memiliki akses ke ${opened}.`;
  }
  return `Akun ini tidak masuk lewat ${opened}. Silakan gunakan halaman ${portals[suggestion].title}.`;
}

export async function loginAction(
  username: string,
  password: string,
  portal: Portal
): Promise<LoginResult> {
  try {
    const def = portals[portal];
    const system = def.system;

    // `role` sengaja tidak dikirim ke pemeriksa kredensial: perannya ditentukan
    // oleh akun, bukan oleh pilihan di layar. Yang diperiksa di bawah adalah
    // apakah peran itu boleh lewat pintu yang dibuka.
    const result = await checkCredentials({ username, password, system });
    if (!result.ok) {
      return { error: messageFor(result.reason, result.today) };
    }

    const user = result.user!;
    const role = user.role as Role;

    if (!def.roles.includes(role)) {
      return { error: wrongPortalMessage(role, portal) };
    }

    // Aturan khusus web: siswa bisa dilarang masuk lewat browser.
    if (role === "STUDENT" && !(await getStudentWebLoginEnabled())) {
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
      details: { username: user.username, role: user.role, portal },
    });

    return { success: true, redirectTo: destinationFor(role, system), role };
  } catch {
    return { error: "Terjadi kesalahan. Periksa koneksi database." };
  }
}

export async function logoutAction() {
  await logAudit({ action: "LOGOUT", entity: "auth" });
  await clearSession();
  redirect("/login");
}
