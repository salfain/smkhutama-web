import { NextRequest } from "next/server";
import { getApiUser } from "./api-auth";
import { isTeacherScheduledForPiket } from "./piket-schedule";

/**
 * Izinkan admin, akun PIKET lama, atau guru yang terjadwal piket hari ini.
 */
export async function requirePiketApiAuth(req: NextRequest) {
  const user = await getApiUser(req);
  if (!user) return { error: "Unauthorized", status: 401 };

  if (user.role === "ADMIN" || user.role === "PIKET") return { user };

  if (user.role === "TEACHER" && user.teacher) {
    const scheduled = await isTeacherScheduledForPiket(user.teacher.id);
    if (scheduled) return { user };
  }

  return { error: "Forbidden - guru tidak terjadwal piket hari ini", status: 403 };
}
