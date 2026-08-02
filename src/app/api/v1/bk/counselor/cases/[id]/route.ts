import type { NextRequest } from "next/server";
import { apiOk, handle, notFound, oneOf, preflight, readJson } from "@/server/http";
import { requireCounselorAccess } from "@/server/auth";
import { COUNSELING_STATUSES, getCase, updateCaseStatus } from "@/server/modules/bk/service";
import { toCaseDetail } from "@/server/modules/bk/dto";

/** GET /api/v1/bk/counselor/cases/{id} */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireCounselorAccess(req);
    const { id } = await ctx.params;

    const record = await getCase(id);
    if (!record) throw notFound("Sesi konseling tidak ditemukan");

    return apiOk(toCaseDetail(record));
  });
}

/** PATCH /api/v1/bk/counselor/cases/{id} — ubah status sesi. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireCounselorAccess(req);
    const { id } = await ctx.params;
    const body = await readJson(req);

    const status = oneOf(body, "status", COUNSELING_STATUSES);
    const updated = await updateCaseStatus(id, status);
    if (!updated) throw notFound("Sesi konseling tidak ditemukan");

    return apiOk({ id, status });
  });
}

export async function OPTIONS() {
  return preflight();
}
