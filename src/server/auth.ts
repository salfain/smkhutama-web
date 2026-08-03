/**
 * Guard autentikasi untuk API v1.
 *
 * Berbeda dengan `src/lib/api-auth.ts` (khusus Bearer token) dan
 * `src/lib/session.ts` (khusus cookie + redirect), guard di sini menerima
 * keduanya: aplikasi mobile mengirim `Authorization: Bearer <jwt>`, sedangkan
 * halaman web yang memanggil API v1 lewat fetch cukup mengandalkan cookie
 * sesi yang sudah ada. Kegagalan dilempar sebagai `ApiError` supaya route
 * handler tidak perlu menulis cabang if-error berulang kali.
 */

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { isTeacherScheduledForPiket } from "@/lib/piket-schedule";
import { forbidden, unauthorized } from "./http";

const SESSION_COOKIE = "cbt-session";

const ACTOR_INCLUDE = {
  student: {
    include: {
      class: { select: { id: true, name: true } },
      major: { select: { name: true, code: true } },
    },
  },
  teacher: {
    include: {
      subject: { select: { id: true, name: true, code: true } },
    },
  },
  counselor: true,
} as const;

export type ApiActor = NonNullable<Awaited<ReturnType<typeof findActor>>>;

export type ActorRole =
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "LANDING_ADMIN"
  | "COUNSELOR"
  | "PIKET"
  | "KURIKULUM"
  | "KESISWAAN"
  | "ADMIN_CBT";

async function findActor(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: ACTOR_INCLUDE,
  });
  if (!user || !user.isActive) return null;
  return user;
}

/**
 * Identitas pemanggil, atau null kalau tidak ada kredensial yang valid.
 * Urutan: Bearer token dulu, baru cookie sesi.
 */
export async function getActor(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const payload = await verifyToken(authHeader.slice(7));
    if (payload) return findActor(payload.userId);
    return null;
  }

  const cookieUserId = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookieUserId) return findActor(cookieUserId);

  return null;
}

/** Wajib login, peran apa pun. */
export async function requireActor(req: NextRequest): Promise<ApiActor> {
  const actor = await getActor(req);
  if (!actor) throw unauthorized();
  return actor;
}

/** Wajib login dengan salah satu peran yang disebut. */
export async function requireRole(req: NextRequest, ...roles: ActorRole[]): Promise<ApiActor> {
  const actor = await requireActor(req);
  if (!roles.includes(actor.role as ActorRole)) throw forbidden();
  return actor;
}

/**
 * Akses modul piket: admin, akun PIKET khusus, atau guru yang memang
 * terjadwal piket pada hari berjalan (zona WIB).
 */
export async function requirePiketAccess(req: NextRequest): Promise<ApiActor> {
  const actor = await requireActor(req);

  if (actor.role === "ADMIN" || actor.role === "PIKET") return actor;

  if (actor.role === "TEACHER" && actor.teacher) {
    const scheduled = await isTeacherScheduledForPiket(actor.teacher.id);
    if (scheduled) return actor;
  }

  throw forbidden("Anda tidak terjadwal piket hari ini", "PIKET_NOT_SCHEDULED");
}

/** Akses modul BK: guru BK atau admin. */
export async function requireCounselorAccess(req: NextRequest): Promise<ApiActor> {
  return requireRole(req, "COUNSELOR", "ADMIN");
}

/**
 * Siswa yang login beserta id profil siswanya. Akun berperan STUDENT tanpa
 * record `Student` tidak bisa berbuat apa-apa, jadi ditolak di sini sekali
 * saja alih-alih dicek ulang di setiap route.
 */
export async function requireStudent(req: NextRequest) {
  const actor = await requireRole(req, "STUDENT");
  if (!actor.student) {
    throw forbidden("Akun ini belum terhubung ke data siswa", "STUDENT_PROFILE_MISSING");
  }
  return { actor, student: actor.student };
}

/** Guru yang login beserta id profil gurunya. */
export async function requireTeacher(req: NextRequest) {
  const actor = await requireRole(req, "TEACHER");
  if (!actor.teacher) {
    throw forbidden("Akun ini belum terhubung ke data guru", "TEACHER_PROFILE_MISSING");
  }
  return { actor, teacher: actor.teacher };
}
