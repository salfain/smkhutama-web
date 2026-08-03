import { apiOk, handle, preflight } from "@/server/http";
import { listGallery } from "@/server/modules/landing/content";
import { toGalleryItem } from "@/server/modules/landing/dto";

/** GET /api/v1/landing/gallery — foto galeri sekolah. Publik. */
export async function GET() {
  return handle(async () => apiOk((await listGallery()).map(toGalleryItem)));
}

export async function OPTIONS() {
  return preflight();
}
