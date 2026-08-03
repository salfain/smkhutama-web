import type { NextRequest } from "next/server";
import { apiOk, handle, preflight } from "@/server/http";
import { requireStudent } from "@/server/auth";
import { listResults } from "@/server/modules/cbt/student";
import { toResult } from "@/server/modules/cbt/dto";

/** GET /api/v1/cbt/student/results — hasil ujian yang sudah dikirim. */
export async function GET(req: NextRequest) {
  return handle(async () => {
    const { student } = await requireStudent(req);
    const attempts = await listResults(student.id);
    return apiOk(attempts.map(toResult));
  });
}

export async function OPTIONS() {
  return preflight();
}
