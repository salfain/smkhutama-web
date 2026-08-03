import type { NextRequest } from "next/server";
import {
  apiOk,
  boolField,
  handle,
  optionalString,
  preflight,
  readJson,
  requiredString,
} from "@/server/http";
import { requireCounselorAccess } from "@/server/auth";
import { listSurveys, saveSurvey } from "@/server/modules/bk/surveys";
import { toSurvey } from "@/server/modules/bk/dto";

/** GET /api/v1/bk/counselor/surveys */
export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireCounselorAccess(req);
    const surveys = await listSurveys();
    return apiOk(surveys.map(toSurvey));
  });
}

/** POST /api/v1/bk/counselor/surveys */
export async function POST(req: NextRequest) {
  return handle(async () => {
    await requireCounselorAccess(req);
    const body = await readJson(req);

    const survey = await saveSurvey({
      title: requiredString(body, "title"),
      description: optionalString(body, "description"),
      isActive: boolField(body, "isActive", true),
    });

    return apiOk({ id: survey.id }, 201);
  });
}

export async function OPTIONS() {
  return preflight();
}
