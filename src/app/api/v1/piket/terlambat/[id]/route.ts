import type { NextRequest } from "next/server";
import { apiOk, handle, notFound, preflight } from "@/server/http";
import { requirePiketAccess } from "@/server/auth";
import { deleteTardiness } from "@/server/modules/piket/service";

/** DELETE /api/v1/piket/terlambat/{id} */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requirePiketAccess(req);
    const { id } = await ctx.params;

    const deleted = await deleteTardiness(id);
    if (!deleted) throw notFound("Catatan keterlambatan tidak ditemukan");

    return apiOk({ id });
  });
}

export async function OPTIONS() {
  return preflight();
}
