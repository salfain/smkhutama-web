import { NextRequest } from "next/server";
import { getApiUser } from "./api-auth";

/**
 * Verifikasi JWT dan izinkan role PIKET atau ADMIN.
 */
export async function requirePiketApiAuth(req: NextRequest) {
  const user = await getApiUser(req);
  if (!user) return { error: "Unauthorized", status: 401 };
  if (user.role !== "PIKET" && user.role !== "ADMIN") {
    return { error: "Forbidden – hanya Guru Piket atau Admin", status: 403 };
  }
  return { user };
}
