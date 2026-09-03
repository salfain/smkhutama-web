import { NextRequest, NextResponse } from "next/server";
import { requirePiketApiAuth } from "@/lib/piket-api-auth";
import { getDashboard } from "@/server/modules/piket/service";
import { toDashboard } from "@/server/modules/piket/dto";

// Endpoint versi lama - bentuk response dipertahankan untuk aplikasi mobile
// yang sudah beredar. Logikanya kini dipinjam dari modul piket; penggantinya
// ada di /api/v1/piket/dashboard (lihat docs/api-v1-plan.md).
export async function GET(req: NextRequest) {
  const r = await requirePiketApiAuth(req);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const result = await getDashboard(req.nextUrl.searchParams.get("date"));
  return NextResponse.json(toDashboard(result));
}
