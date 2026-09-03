import { apiOk, handle, preflight } from "@/server/http";
import { listStats } from "@/server/modules/landing/content";
import { toStat } from "@/server/modules/landing/dto";

/** GET /api/v1/landing/stats - angka ringkas sekolah. Publik. */
export async function GET() {
  return handle(async () => apiOk((await listStats()).map(toStat)));
}

export async function OPTIONS() {
  return preflight();
}
