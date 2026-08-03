import type { NextRequest } from "next/server";
import { apiOk, handle, notFound, preflight } from "@/server/http";
import { requirePiketAccess } from "@/server/auth";
import { deletePermit } from "@/server/modules/piket/service";

/** DELETE /api/v1/piket/izin/{id} */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requirePiketAccess(req);
    const { id } = await ctx.params;

    const deleted = await deletePermit(id);
    if (!deleted) throw notFound("Catatan izin tidak ditemukan");

    return apiOk({ id });
  });
}

export async function OPTIONS() {
  return preflight();
}
