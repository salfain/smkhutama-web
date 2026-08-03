import type { NextRequest } from "next/server";
import { apiOk, handle, preflight } from "@/server/http";
import { requireCounselorAccess } from "@/server/auth";
import { listStudentsWithPoints } from "@/server/modules/bk/service";
import { toStudentWithPoints } from "@/server/modules/bk/dto";

/** GET /api/v1/bk/counselor/students/book — buku siswa beserta akumulasi poin. */
export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireCounselorAccess(req);
    const students = await listStudentsWithPoints();
    return apiOk(students.map(toStudentWithPoints));
  });
}

export async function OPTIONS() {
  return preflight();
}
