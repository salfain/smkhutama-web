import type { NextRequest } from "next/server";
import { apiOk, handle, optionalString, preflight, readJson, requiredString } from "@/server/http";
import { requirePiketAccess } from "@/server/auth";
import { createTardiness, listTardiness } from "@/server/modules/piket/service";
import { toStudentOption, toTardiness } from "@/server/modules/piket/dto";

/** GET /api/v1/piket/terlambat?date=YYYY-MM-DD */
export async function GET(req: NextRequest) {
  return handle(async () => {
    await requirePiketAccess(req);
    const { records, students } = await listTardiness(req.nextUrl.searchParams.get("date"));
    return apiOk({
      records: records.map(toTardiness),
      students: students.map(toStudentOption),
    });
  });
}

/** POST /api/v1/piket/terlambat */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const actor = await requirePiketAccess(req);
    const body = await readJson(req);

    const record = await createTardiness({
      studentId: requiredString(body, "studentId"),
      recordedBy: actor.id,
      reason: optionalString(body, "reason"),
      sanction: optionalString(body, "sanction"),
      arrivalTime: optionalString(body, "arrivalTime"),
      date: optionalString(body, "date"),
    });

    return apiOk({ id: record.id }, 201);
  });
}

export async function OPTIONS() {
  return preflight();
}
