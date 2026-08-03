import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";
import { isTeacherScheduledForPiket } from "./piket-schedule";

const COOKIE_NAME = "cbt-session";

export type AppRole =
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "LANDING_ADMIN"
  | "COUNSELOR"
  | "PIKET"
  | "KURIKULUM"
  | "KESISWAAN"
  | "ADMIN_CBT";

export type AdminAreaRole = "ADMIN" | "KURIKULUM" | "KESISWAAN" | "ADMIN_CBT";

export async function getSession() {
  const c = await cookies();
  const userId = c.get(COOKIE_NAME)?.value;
  if (!userId) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: { include: { class: { select: { name: true } }, major: { select: { name: true, code: true } } } },
        teacher: { include: { subject: { select: { id: true, name: true, code: true } } } },
        counselor: true,
      },
    });
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

export async function setSession(userId: string) {
  const c = await cookies();
  c.set(COOKIE_NAME, userId, {
    httpOnly: true,
    // Set COOKIE_SECURE=true di .env hanya jika server sudah pakai HTTPS.
    // Di VPS HTTP, biarkan false agar cookie tetap terkirim browser.
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSession() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export async function requireAuth(...roles: AppRole[]) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (roles.length > 0 && !roles.includes(user.role as AppRole)) redirect("/login");
  return user;
}

/**
 * Gerbang kerangka /admin. Hanya memastikan penggunanya salah satu peran
 * keluarga admin — TIDAK menentukan halaman mana yang boleh dibuka.
 * Pembatasan per halaman dilakukan di masing-masing page.tsx dan actions.ts.
 */
export async function requireAdminArea() {
  const user = await requireAuth("ADMIN", "KURIKULUM", "KESISWAAN", "ADMIN_CBT");
  return user as typeof user & { role: AdminAreaRole };
}

export async function requireCounselorAuth() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "COUNSELOR" && user.role !== "ADMIN") redirect("/login");
  return user;
}

export async function requirePiketAuth() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role === "ADMIN" || user.role === "PIKET") return user;
  if (user.role === "TEACHER" && user.teacher) {
    const scheduled = await isTeacherScheduledForPiket(user.teacher.id);
    if (scheduled) return user;
  }
  redirect("/login");
}

export async function requireCmsAuth() {
  const user = await getSession();
  if (!user) redirect("/cms/login");
  if (user.role !== "LANDING_ADMIN" && user.role !== "ADMIN") redirect("/cms/login");
  return user;
}
