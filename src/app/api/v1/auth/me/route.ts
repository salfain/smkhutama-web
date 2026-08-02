import type { NextRequest } from "next/server";
import { apiOk, handle, preflight } from "@/server/http";
import { requireActor } from "@/server/auth";
import { toProfile } from "@/server/modules/auth/service";

/** GET /api/v1/auth/me — profil pemanggil (Bearer token atau cookie sesi). */
export async function GET(req: NextRequest) {
  return handle(async () => {
    const actor = await requireActor(req);
    return apiOk(toProfile(actor));
  });
}

export async function OPTIONS() {
  return preflight();
}
