import type { NextRequest } from "next/server";
import { apiOk, handle, notFound, preflight } from "@/server/http";
import { requireCounselorAccess } from "@/server/auth";
import { getStudentBook } from "@/server/modules/bk/service";
import { toStudentBook } from "@/server/modules/bk/dto";

/** GET /api/v1/bk/counselor/students/book/{id} — riwayat BK lengkap satu siswa. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireCounselorAccess(req);
    const { id } = await ctx.params;

    const student = await getStudentBook(id);
    if (!student) throw notFound("Siswa tidak ditemukan");

    return apiOk(toStudentBook(student));
  });
}

export async function OPTIONS() {
  return preflight();
}
