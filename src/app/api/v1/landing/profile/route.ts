import { apiOk, handle, preflight } from "@/server/http";
import { getProfile } from "@/server/modules/landing/content";
import { toProfile } from "@/server/modules/landing/dto";

/** GET /api/v1/landing/profile — identitas, kontak, dan tautan sekolah. Publik. */
export async function GET() {
  return handle(async () => apiOk(toProfile(await getProfile())));
}

export async function OPTIONS() {
  return preflight();
}
