import type { NextRequest } from "next/server";
import { apiOk, handle, preflight } from "@/server/http";
import { requireCounselorAccess } from "@/server/auth";
import { listStudents } from "@/server/modules/bk/service";
import { toStudentOption } from "@/server/modules/bk/dto";

/** GET /api/v1/bk/counselor/students - daftar siswa untuk pilihan form. */
export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireCounselorAccess(req);
    const students = await listStudents();
    return apiOk(students.map(toStudentOption));
  });
}

export async function OPTIONS() {
  return preflight();
}
