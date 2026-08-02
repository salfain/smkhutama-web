import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { preflight } from "@/server/http";
import { readSchoolLogo } from "@/server/modules/shared/assets";

/**
 * GET /api/v1/landing/logo — logo sekolah. Publik.
 *
 * Mengembalikan gambar, bukan JSON. Bila logo belum diunggah, dialihkan ke
 * favicon bawaan supaya klien selalu mendapat gambar yang bisa ditampilkan.
 */
export async function GET(req: NextRequest) {
  const logo = await readSchoolLogo();
  if (!logo) return NextResponse.redirect(new URL("/favicon.ico", req.url));

  return new NextResponse(new Uint8Array(logo.buffer), {
    headers: {
      "Content-Type": logo.contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function OPTIONS() {
  return preflight();
}
