import type { NextRequest } from "next/server";
import {
  apiOk,
  boolField,
  handle,
  oneOf,
  optionalString,
  preflight,
  readJson,
  requiredString,
} from "@/server/http";
import { requireCounselorAccess } from "@/server/auth";
import {
  COUNSELING_STATUSES,
  COUNSELING_TYPES,
  ensureCounselorId,
  listCases,
  saveCase,
} from "@/server/modules/bk/service";
import { toCase } from "@/server/modules/bk/dto";

/** GET /api/v1/bk/counselor/cases */
export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireCounselorAccess(req);
    const cases = await listCases();
    return apiOk(cases.map(toCase));
  });
}

/** POST /api/v1/bk/counselor/cases — buat sesi konseling baru. */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const actor = await requireCounselorAccess(req);
    const body = await readJson(req);

    const record = await saveCase({
      studentId: requiredString(body, "studentId"),
      counselorId: await ensureCounselorId(actor.id),
      type: oneOf(body, "type", COUNSELING_TYPES, "PRIBADI"),
      status: oneOf(body, "status", COUNSELING_STATUSES, "OPEN"),
      title: requiredString(body, "title"),
      description: optionalString(body, "description"),
      notes: optionalString(body, "notes"),
      followUp: optionalString(body, "followUp"),
      isConfidential: boolField(body, "isConfidential", true),
      sessionDate: optionalString(body, "sessionDate"),
    });

    return apiOk({ id: record.id }, 201);
  });
}

export async function OPTIONS() {
  return preflight();
}
