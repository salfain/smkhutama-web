import type { NextRequest } from "next/server";
import { apiOk, handle, preflight } from "@/server/http";
import { requireStudent } from "@/server/auth";
import { getStudentBkSummary } from "@/server/modules/bk/service";
import { toStudentSummary } from "@/server/modules/bk/dto";

/** GET /api/v1/bk/student/summary - poin, pelanggaran, prestasi, sesi, permohonan. */
export async function GET(req: NextRequest) {
  return handle(async () => {
    const { student } = await requireStudent(req);
    const summary = await getStudentBkSummary(student.id);
    return apiOk(toStudentSummary(summary));
  });
}

export async function OPTIONS() {
  return preflight();
}
