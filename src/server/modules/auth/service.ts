/**
 * Modul Auth (lintas modul).
 *
 * Login dipakai semua sub-sistem — CBT, BK, dan piket — jadi tetap satu pintu,
 * tidak dipecah ke tiap modul. Yang membedakan hanyalah parameter `system`
 * (mis. "PIKET") yang menambah syarat khusus saat memberi token.
 */

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { createToken } from "@/lib/jwt";
import { logAudit } from "@/lib/audit";
import {
  getJakartaDayOfWeek,
  getPiketDayName,
  isTeacherScheduledForPiket,
} from "@/lib/piket-schedule";
import { badRequest, forbidden, unauthorized } from "@/server/http";
import type { ApiActor } from "@/server/auth";
import { hasActiveAssignment } from "@/lib/assignment-access";

export type LoginInput = {
  username?: string | null;
  password?: string | null;
  /** Batasi login ke satu peran tertentu, mis. "STUDENT". */
  role?: string | null;
  /** Sub-sistem yang dituju; "PIKET" menambah syarat jadwal piket hari ini. */
  system?: string | null;
};

export type CredentialFailure =
  | "MISSING_FIELDS"
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_INACTIVE"
  | "ROLE_MISMATCH"
  | "PIKET_REQUIRES_TEACHER"
  | "PIKET_NOT_SCHEDULED";

export type CredentialResult =
  | { ok: true; user: Awaited<ReturnType<typeof findLoginUser>> }
  | { ok: false; reason: CredentialFailure; today?: string };

function findLoginUser(username: string) {
  return prisma.user.findUnique({ where: { username }, include: { teacher: true } });
}

/**
 * Periksa kredensial beserta syarat tambahannya, tanpa membuat sesi apa pun.
 *
 * Kegagalan dikembalikan sebagai **kode**, bukan kalimat: halaman web dan API
 * memakai susunan kalimat yang berbeda (web mengakhiri pesannya dengan titik),
 * jadi yang dibagi di sini aturannya, bukan teksnya.
 */
export async function checkCredentials(input: LoginInput): Promise<CredentialResult> {
  const username = input.username?.trim();
  const password = input.password;

  if (!username || !password) return { ok: false, reason: "MISSING_FIELDS" };

  const user = await findLoginUser(username);
  if (!user) return { ok: false, reason: "INVALID_CREDENTIALS" };
  if (!user.isActive) return { ok: false, reason: "ACCOUNT_INACTIVE" };
  if (input.role && user.role !== input.role) return { ok: false, reason: "ROLE_MISMATCH" };

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) return { ok: false, reason: "INVALID_CREDENTIALS" };

  if (input.system === "PIKET") {
    const assignedPiket = user.role === "PIKET" || await hasActiveAssignment(user.id, "PIKET");
    if (assignedPiket) return { ok: true, user };
    if (user.role !== "TEACHER" || !user.teacher) {
      return { ok: false, reason: "PIKET_REQUIRES_TEACHER" };
    }
    const scheduled = await isTeacherScheduledForPiket(user.teacher.id);
    if (!scheduled) {
      return {
        ok: false,
        reason: "PIKET_NOT_SCHEDULED",
        today: getPiketDayName(getJakartaDayOfWeek()),
      };
    }
  }

  return { ok: true, user };
}

/**
 * Saklar "izinkan siswa login lewat aplikasi mobile", diatur di
 * /admin/student-access. Default aktif: sebelum saklar ini ada login mobile
 * siswa selalu diizinkan, jadi baris setting yang belum pernah dibuat tidak
 * boleh mengunci siswa.
 */
export async function getStudentMobileLoginEnabled() {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "allow_student_mobile_login" },
    select: { value: true },
  });
  return setting?.value !== "false";
}

export async function login(input: LoginInput) {
  const result = await checkCredentials(input);

  if (!result.ok) {
    switch (result.reason) {
      case "MISSING_FIELDS":
        throw badRequest("Username dan password wajib diisi", "VALIDATION_ERROR");
      case "ACCOUNT_INACTIVE":
        throw forbidden("Akun nonaktif. Hubungi admin.", "ACCOUNT_INACTIVE");
      case "ROLE_MISMATCH":
        throw forbidden(`Akun ini bukan akun ${input.role?.toLowerCase()}`, "ROLE_MISMATCH");
      case "PIKET_REQUIRES_TEACHER":
        throw forbidden("Login piket menggunakan akun guru", "PIKET_REQUIRES_TEACHER");
      case "PIKET_NOT_SCHEDULED":
        throw forbidden(
          `Anda tidak terjadwal piket hari ${result.today}. Hubungi admin jika jadwal belum diatur.`,
          "PIKET_NOT_SCHEDULED"
        );
      default:
        throw unauthorized("Username atau password salah", "INVALID_CREDENTIALS");
    }
  }

  const user = result.user!;

  if (user.role === "STUDENT" && !(await getStudentMobileLoginEnabled())) {
    throw forbidden(
      "Login siswa melalui aplikasi mobile sedang dinonaktifkan. Hubungi admin.",
      "STUDENT_MOBILE_LOGIN_DISABLED"
    );
  }

  const token = await createToken(user.id, user.role);

  await logAudit({
    userId: user.id,
    action: "API_LOGIN_SUCCESS",
    entity: "auth",
    entityId: user.id,
    details: { username: user.username, role: user.role, system: input.system ?? null },
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
}

/** Profil lengkap pemanggil, termasuk relasi peran yang relevan. */
export function toProfile(actor: ApiActor) {
  return {
    id: actor.id,
    name: actor.name,
    username: actor.username,
    email: actor.email,
    role: actor.role,
    student: actor.student
      ? {
          id: actor.student.id,
          nis: actor.student.nis,
          nisn: actor.student.nisn,
          gender: actor.student.gender,
          class: actor.student.class,
          major: actor.student.major,
        }
      : null,
    teacher: actor.teacher
      ? {
          id: actor.teacher.id,
          nip: actor.teacher.nip,
          subject: actor.teacher.subject,
        }
      : null,
    counselor: actor.counselor
      ? {
          id: actor.counselor.id,
          nip: actor.counselor.nip,
          phone: actor.counselor.phone,
        }
      : null,
  };
}
