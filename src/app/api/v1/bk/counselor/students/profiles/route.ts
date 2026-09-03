import type { NextRequest } from "next/server";
import { apiOk, handle, preflight } from "@/server/http";
import { requireCounselorAccess } from "@/server/auth";
import * as profile from "@/server/modules/bk/profile";

/** GET /api/v1/bk/counselor/students/profiles - antrean biodata yang menunggu verifikasi. */
export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireCounselorAccess(req);
    const rows = await profile.listPendingProfiles();
    return apiOk({ total: rows.length, items: rows.map(profile.toProfileDto) });
  });
}

export async function OPTIONS() {
  return preflight();
}
