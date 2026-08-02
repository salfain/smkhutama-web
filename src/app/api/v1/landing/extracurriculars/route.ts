import { apiOk, handle, preflight } from "@/server/http";
import { listExtracurriculars } from "@/server/modules/landing/content";

/** GET /api/v1/landing/extracurriculars — kegiatan ekstrakurikuler. Publik. */
export async function GET() {
  return handle(async () => apiOk(await listExtracurriculars()));
}

export async function OPTIONS() {
  return preflight();
}
