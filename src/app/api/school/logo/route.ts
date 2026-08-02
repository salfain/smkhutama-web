import { NextRequest, NextResponse } from "next/server";
import { readSchoolLogo } from "@/server/modules/shared/assets";

// Endpoint versi lama. Penggantinya: GET /api/v1/landing/logo.
export async function GET(req: NextRequest) {
  const logo = await readSchoolLogo();
  // Belum ada logo atau berkasnya hilang → pakai favicon bawaan.
  if (!logo) return NextResponse.redirect(new URL("/favicon.ico", req.url));

  return new NextResponse(new Uint8Array(logo.buffer), {
    headers: {
      "Content-Type": logo.contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
