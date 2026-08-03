import type { NextRequest } from "next/server";
import { apiOk, handle, preflight } from "@/server/http";
import { requireCounselorAccess } from "@/server/auth";
import { listRequests } from "@/server/modules/bk/service";
import { toRequest } from "@/server/modules/bk/dto";

/** GET /api/v1/bk/counselor/requests — permohonan konseling dari siswa. */
export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireCounselorAccess(req);
    const rows = await listRequests();
    return apiOk(rows.map(toRequest));
  });
}

export async function OPTIONS() {
  return preflight();
}
