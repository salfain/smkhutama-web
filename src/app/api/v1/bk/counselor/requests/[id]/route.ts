import type { NextRequest } from "next/server";
import { apiOk, handle, notFound, oneOf, optionalString, preflight, readJson } from "@/server/http";
import { requireCounselorAccess } from "@/server/auth";
import {
  REQUEST_STATUSES,
  convertRequestToCase,
  ensureCounselorId,
  respondRequest,
} from "@/server/modules/bk/service";

/**
 * PATCH /api/v1/bk/counselor/requests/{id}
 *
 * Body `{ status, response? }` menanggapi permohonan. Kirim
 * `{ convertToCase: true }` untuk sekalian membuat sesi konseling dari isinya
 * — jalur yang sebelumnya hanya tersedia di halaman web.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const actor = await requireCounselorAccess(req);
    const { id } = await ctx.params;
    const body = await readJson(req);

    if (body.convertToCase === true) {
      const counselorId = await ensureCounselorId(actor.id);
      const createdCase = await convertRequestToCase(id, counselorId);
      if (!createdCase) throw notFound("Permohonan tidak ditemukan");
      return apiOk({ id, status: "SCHEDULED", caseId: createdCase.id });
    }

    const status = oneOf(body, "status", REQUEST_STATUSES);
    const updated = await respondRequest(id, status, optionalString(body, "response"));
    if (!updated) throw notFound("Permohonan tidak ditemukan");

    return apiOk({ id, status });
  });
}

export async function OPTIONS() {
  return preflight();
}
