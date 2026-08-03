import type { NextRequest } from "next/server";
import { apiOk, handle, notFound, preflight } from "@/server/http";
import { requirePiketAccess } from "@/server/auth";
import { deleteAttendance } from "@/server/modules/piket/service";

/** DELETE /api/v1/piket/guru/{id} */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requirePiketAccess(req);
    const { id } = await ctx.params;

    const deleted = await deleteAttendance(id);
    if (!deleted) throw notFound("Catatan kehadiran guru tidak ditemukan");

    return apiOk({ id });
  });
}

export async function OPTIONS() {
  return preflight();
}
