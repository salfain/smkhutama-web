import { NextRequest } from "next/server";
import { verifyToken } from "./jwt";
import { prisma } from "./prisma";

/**
 * Middleware helper: extract & verify JWT from Authorization header
 * Returns the full user object or null
 */
export async function getApiUser(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
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
    },
  });

  if (!user || !user.isActive) return null;
  return user;
}

/**
 * Helper: require authenticated user with specific role
 */
export async function requireApiAuth(req: NextRequest, role?: "ADMIN" | "TEACHER" | "STUDENT") {
  const user = await getApiUser(req);
  if (!user) return { error: "Unauthorized", status: 401 };
  if (role && user.role !== role) return { error: "Forbidden", status: 403 };
  return { user };
}
