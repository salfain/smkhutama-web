import { apiOk, handle, preflight } from "@/server/http";
import { listMajors } from "@/server/modules/landing/content";
import { toMajor } from "@/server/modules/landing/dto";

/** GET /api/v1/landing/majors - program keahlian. Publik. */
export async function GET() {
  return handle(async () => apiOk((await listMajors()).map(toMajor)));
}

export async function OPTIONS() {
  return preflight();
}
