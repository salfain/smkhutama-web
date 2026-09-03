import { apiOk, handle, preflight } from "@/server/http";
import { listHeroImages } from "@/server/modules/landing/content";

/** GET /api/v1/landing/hero-images - gambar carousel beranda. Publik. */
export async function GET() {
  return handle(async () => apiOk(await listHeroImages()));
}

export async function OPTIONS() {
  return preflight();
}
