import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";
import { isTeacherScheduledForPiket } from "./piket-schedule";
import { getActiveAssignmentTypes, hasActiveAssignment } from "./assignment-access";

const COOKIE_NAME = "cbt-session";
const SESSION_ISSUER = "smk-hutama-web";
const SESSION_AUDIENCE = "smk-hutama-session";

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET ?? process.env.AUTH_SECRET ?? process.env.JWT_SECRET ?? process.env.DATABASE_URL;
  if (!secret) throw new Error("SESSION_SECRET belum dikonfigurasi");
  return new TextEncoder().encode(secret);
}

async function createSessionToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSessionSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function getSessionUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return token ? verifySessionToken(token) : null;
}

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
  const userId = await getSessionUserId();
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
  c.set(COOKIE_NAME, await createSessionToken(userId), {
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
  if (roles.length > 0 && !roles.includes(user.role as AppRole)) {
    const assignableRoles = roles.filter((role): role is "KURIKULUM" | "KESISWAAN" | "ADMIN_CBT" | "COUNSELOR" | "PIKET" =>
      ["KURIKULUM", "KESISWAAN", "ADMIN_CBT", "COUNSELOR", "PIKET"].includes(role),
    );
    const allowed = (await Promise.all(assignableRoles.map((role) => hasActiveAssignment(user.id, role)))).some(Boolean);
    if (!allowed) redirect("/login");
  }
  return user;
}

/**
 * Gerbang kerangka /admin. Hanya memastikan penggunanya salah satu peran
 * keluarga admin - TIDAK menentukan halaman mana yang boleh dibuka.
 * Pembatasan per halaman dilakukan di masing-masing page.tsx dan actions.ts.
 */
export async function requireAdminArea() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (["ADMIN", "KURIKULUM", "KESISWAAN", "ADMIN_CBT"].includes(user.role)) {
    return user as typeof user & { role: AdminAreaRole };
  }
  const assignments = await getActiveAssignmentTypes(user.id);
  const effectiveRole = (["KURIKULUM", "KESISWAAN", "ADMIN_CBT"] as const).find((role) => assignments.includes(role));
  if (!effectiveRole) redirect("/login");
  return { ...user, role: effectiveRole } as typeof user & { role: AdminAreaRole };
}

export async function requireCounselorAuth() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "COUNSELOR" && user.role !== "ADMIN" && !(await hasActiveAssignment(user.id, "COUNSELOR"))) redirect("/login");
  return user;
}

export async function requirePiketAuth() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role === "ADMIN" || user.role === "PIKET" || (await hasActiveAssignment(user.id, "PIKET"))) return user;
  if (user.role === "TEACHER" && user.teacher) {
    const scheduled = await isTeacherScheduledForPiket(user.teacher.id);
    if (scheduled) return user;
  }
  redirect("/login");
}

export async function requireCmsAuth() {
  const user = await getSession();
  if (!user) redirect("/cms/login");
  if (user.role !== "LANDING_ADMIN" && user.role !== "ADMIN" && !(await hasActiveAssignment(user.id, "CMS"))) redirect("/cms/login");
  return user;
}
