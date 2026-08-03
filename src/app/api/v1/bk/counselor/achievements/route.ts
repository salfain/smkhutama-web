import type { NextRequest } from "next/server";
import {
  apiOk,
  handle,
  intField,
  optionalString,
  preflight,
  readJson,
  requiredString,
} from "@/server/http";
import { requireCounselorAccess, requireRole } from "@/server/auth";
import { listAchievements, saveAchievement } from "@/server/modules/bk/service";
import { toAchievement } from "@/server/modules/bk/dto";

const DEFAULT_TAKE = 50;

/** GET /api/v1/bk/counselor/achievements?take=50 (`take=0` berarti semua). */
export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireCounselorAccess(req);

    const rawTake = req.nextUrl.searchParams.get("take");
    const parsed = rawTake === null ? DEFAULT_TAKE : parseInt(rawTake, 10);
    const take = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;

    const rows = await listAchievements({ take });
    return apiOk(rows.map(toAchievement));
  });
}

/** POST /api/v1/bk/counselor/achievements */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const actor = await requireRole(req, "KESISWAAN");
    const body = await readJson(req);

    const record = await saveAchievement({
      studentId: requiredString(body, "studentId"),
      recordedById: actor.id,
      title: requiredString(body, "title"),
      description: optionalString(body, "description"),
      points: intField(body, "points"),
      level: optionalString(body, "level"),
      date: optionalString(body, "date"),
    });

    return apiOk({ id: record.id }, 201);
  });
}

export async function OPTIONS() {
  return preflight();
}
