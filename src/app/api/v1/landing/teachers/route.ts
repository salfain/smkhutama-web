import { apiOk, handle, preflight } from "@/server/http";
import { listTeachers } from "@/server/modules/landing/content";

/** GET /api/v1/landing/teachers - guru & tenaga pendidik. Publik. */
export async function GET() {
  return handle(async () => apiOk(await listTeachers()));
}

export async function OPTIONS() {
  return preflight();
}
