import { apiOk, handle, preflight } from "@/server/http";

/**
 * POST /api/v1/auth/logout
 *
 * Token JWT bersifat stateless, jadi logout sesungguhnya terjadi di klien
 * (hapus token tersimpan). Endpoint ini tetap ada supaya kontrak API lengkap
 * dan klien punya satu tempat untuk memicu pembersihan sesi.
 */
export async function POST() {
  return handle(async () => apiOk({ loggedOut: true }));
}

export async function OPTIONS() {
  return preflight();
}
