import type { NextRequest } from "next/server";
import { apiOk, handle, notFound, preflight } from "@/server/http";
import { requirePiketAccess } from "@/server/auth";
import { markPermitReturned } from "@/server/modules/piket/service";

/** PATCH /api/v1/piket/izin/{id}/kembali — tandai siswa sudah kembali. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requirePiketAccess(req);
    const { id } = await ctx.params;

    const updated = await markPermitReturned(id);
    if (!updated) throw notFound("Catatan izin tidak ditemukan");

    return apiOk({ id, status: "SUDAH_KEMBALI" });
  });
}

export async function OPTIONS() {
  return preflight();
}
