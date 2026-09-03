import type { NextRequest } from "next/server";
import { apiOk, handle, preflight } from "@/server/http";
import { requireTeacher } from "@/server/auth";
import { getTeacherCounts } from "@/server/modules/cbt/teacher";
import { toTeacherStats } from "@/server/modules/cbt/dto";

/** GET /api/v1/cbt/teacher/dashboard - ringkasan angka milik guru. */
export async function GET(req: NextRequest) {
  return handle(async () => {
    const { teacher } = await requireTeacher(req);
    const counts = await getTeacherCounts(teacher.id);
    return apiOk(toTeacherStats(counts));
  });
}

export async function OPTIONS() {
  return preflight();
}
