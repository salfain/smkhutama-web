import type { NextRequest } from "next/server";
import { apiOk, handle, preflight } from "@/server/http";
import { requireCounselorAccess } from "@/server/auth";
import { getCounselorDashboard, getTopViolationStudents } from "@/server/modules/bk/service";
import { toDashboard } from "@/server/modules/bk/dto";

/**
 * GET /api/v1/bk/counselor/dashboard
 *
 * Berbeda dengan `/api/counselor/dashboard` yang lama, response v1 juga
 * memuat `topStudents` — sama seperti yang dilihat halaman web guru BK.
 */
export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireCounselorAccess(req);

    const [dashboard, topStudents] = await Promise.all([
      getCounselorDashboard(),
      getTopViolationStudents(),
    ]);

    return apiOk({ ...toDashboard(dashboard), topStudents });
  });
}

export async function OPTIONS() {
  return preflight();
}
