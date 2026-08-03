import type { NextRequest } from "next/server";
import { apiOk, handle, preflight } from "@/server/http";
import { requireStudent } from "@/server/auth";
import { getDashboard } from "@/server/modules/cbt/student";

/** GET /api/v1/cbt/student/dashboard — ujian hari ini, mendatang, dan hasil terakhir. */
export async function GET(req: NextRequest) {
  return handle(async () => {
    const { student } = await requireStudent(req);
    return apiOk(await getDashboard(student));
  });
}

export async function OPTIONS() {
  return preflight();
}
