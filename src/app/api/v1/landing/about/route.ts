import { apiOk, handle, preflight } from "@/server/http";
import { getAbout } from "@/server/modules/landing/content";

/** GET /api/v1/landing/about - visi, misi, sejarah, sambutan kepala sekolah. Publik. */
export async function GET() {
  return handle(async () => apiOk(await getAbout()));
}

export async function OPTIONS() {
  return preflight();
}
