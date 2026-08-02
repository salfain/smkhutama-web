import type { NextRequest } from "next/server";
import { apiOk, handle, preflight, readJson, requiredString } from "@/server/http";
import { requirePiketAccess } from "@/server/auth";
import { createPermit, listPermits } from "@/server/modules/piket/service";
import { toPermit, toStudentOption } from "@/server/modules/piket/dto";

/** GET /api/v1/piket/izin?date=YYYY-MM-DD */
export async function GET(req: NextRequest) {
  return handle(async () => {
    await requirePiketAccess(req);
    const { records, students } = await listPermits(req.nextUrl.searchParams.get("date"));
    return apiOk({
      records: records.map(toPermit),
      students: students.map(toStudentOption),
    });
  });
}

/** POST /api/v1/piket/izin */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const actor = await requirePiketAccess(req);
    const body = await readJson(req);

    const record = await createPermit({
      studentId: requiredString(body, "studentId"),
      reason: requiredString(body, "reason"),
      recordedBy: actor.id,
    });

    return apiOk({ id: record.id }, 201);
  });
}

export async function OPTIONS() {
  return preflight();
}
