import { apiOk, handle, preflight } from "@/server/http";
import { listFaq } from "@/server/modules/landing/content";
import { toFaqItem } from "@/server/modules/landing/dto";

/** GET /api/v1/landing/faq - pertanyaan yang sering diajukan. Publik. */
export async function GET() {
  return handle(async () => apiOk((await listFaq()).map(toFaqItem)));
}

export async function OPTIONS() {
  return preflight();
}
