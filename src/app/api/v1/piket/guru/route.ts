import type { NextRequest } from "next/server";
import { apiOk, handle, optionalString, preflight, readJson, requiredString } from "@/server/http";
import { requirePiketAccess } from "@/server/auth";
import { createAttendance, listAttendance } from "@/server/modules/piket/service";
import { toAttendance, toClassOption, toTeacherOption } from "@/server/modules/piket/dto";

/** GET /api/v1/piket/guru?date=YYYY-MM-DD — kehadiran guru di kelas. */
export async function GET(req: NextRequest) {
  return handle(async () => {
    await requirePiketAccess(req);
    const { records, teachers, classes } = await listAttendance(
      req.nextUrl.searchParams.get("date")
    );
    return apiOk({
      records: records.map(toAttendance),
      teachers: teachers.map(toTeacherOption),
      classes: classes.map(toClassOption),
    });
  });
}

/** POST /api/v1/piket/guru */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const actor = await requirePiketAccess(req);
    const body = await readJson(req);

    const record = await createAttendance({
      teacherId: requiredString(body, "teacherId"),
      classId: requiredString(body, "classId"),
      recordedBy: actor.id,
      status: optionalString(body, "status"),
      period: optionalString(body, "period"),
      substitute: optionalString(body, "substitute"),
      note: optionalString(body, "note"),
      date: optionalString(body, "date"),
    });

    return apiOk({ id: record.id }, 201);
  });
}

export async function OPTIONS() {
  return preflight();
}
