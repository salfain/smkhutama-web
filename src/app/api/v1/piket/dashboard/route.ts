import type { NextRequest } from "next/server";
import { apiOk, handle, preflight } from "@/server/http";
import { requirePiketAccess } from "@/server/auth";
import { getDashboard } from "@/server/modules/piket/service";
import { toDashboard } from "@/server/modules/piket/dto";

/** GET /api/v1/piket/dashboard?date=YYYY-MM-DD */
export async function GET(req: NextRequest) {
  return handle(async () => {
    await requirePiketAccess(req);
    const result = await getDashboard(req.nextUrl.searchParams.get("date"));
    return apiOk(toDashboard(result));
  });
}

export async function OPTIONS() {
  return preflight();
}
