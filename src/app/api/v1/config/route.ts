import { apiOk, handle, preflight } from "@/server/http";
import { getClientConfig } from "@/server/modules/shared/config";

/**
 * GET /api/v1/config - pengaturan runtime untuk aplikasi klien. Publik.
 *
 * Dipanggil sebelum login, jadi tidak boleh meminta autentikasi: klien perlu
 * tahu mode pemeliharaan dan versi minimum justru saat belum bisa masuk.
 */
export async function GET() {
  return handle(async () => apiOk(await getClientConfig()));
}

export async function OPTIONS() {
  return preflight();
}
