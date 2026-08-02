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

export type LoginInput = {
  username?: string | null;
  password?: string | null;
  /** Batasi login ke satu peran tertentu, mis. "STUDENT". */
  role?: string | null;
  /** Sub-sistem yang dituju; "PIKET" menambah syarat jadwal piket hari ini. */
  system?: string | null;
};

export async function login(input: LoginInput) {
  const username = input.username?.trim();
  const password = input.password;

  if (!username || !password) {
    throw badRequest("Username dan password wajib diisi", "VALIDATION_ERROR");
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: { teacher: true },
  });

  const credentialsError = unauthorized("Username atau password salah", "INVALID_CREDENTIALS");
  if (!user) throw credentialsError;
  if (!user.isActive) throw forbidden("Akun nonaktif. Hubungi admin.", "ACCOUNT_INACTIVE");
  if (input.role && user.role !== input.role) {
    throw forbidden(`Akun ini bukan akun ${input.role.toLowerCase()}`, "ROLE_MISMATCH");
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) throw credentialsError;

  if (input.system === "PIKET") {
    if (user.role !== "TEACHER" || !user.teacher) {
      throw forbidden("Login piket menggunakan akun guru", "PIKET_REQUIRES_TEACHER");
    }
    const scheduled = await isTeacherScheduledForPiket(user.teacher.id);
    if (!scheduled) {
      const today = getPiketDayName(getJakartaDayOfWeek());
      throw forbidden(
        `Anda tidak terjadwal piket hari ${today}. Hubungi admin jika jadwal belum diatur.`,
        "PIKET_NOT_SCHEDULED"
      );
    }
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
