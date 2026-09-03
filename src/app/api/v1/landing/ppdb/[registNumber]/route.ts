import type { NextRequest } from "next/server";
import { apiOk, handle, notFound, preflight } from "@/server/http";
import { findRegistration } from "@/server/modules/landing/ppdb";
import { toRegistrationStatus } from "@/server/modules/landing/dto";

/**
 * GET /api/v1/landing/ppdb/{registNumber} - status pendaftaran. Publik.
 *
 * Hanya nama, jurusan pilihan, dan status yang dikirim. Nomor pendaftaran
 * bisa ditebak, jadi endpoint ini tidak boleh membocorkan alamat, email,
 * atau nomor telepon pendaftar.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ registNumber: string }> }) {
  return handle(async () => {
    const { registNumber } = await ctx.params;

    const registration = await findRegistration(decodeURIComponent(registNumber));
    if (!registration) {
      throw notFound("Nomor pendaftaran tidak ditemukan", "REGISTRATION_NOT_FOUND");
    }

    return apiOk(toRegistrationStatus(registration));
  });
}

export async function OPTIONS() {
  return preflight();
}
