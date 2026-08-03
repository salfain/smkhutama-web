import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { getCounselorDashboard } from "@/server/modules/bk/service";
import { toDashboard } from "@/server/modules/bk/dto";

// Endpoint versi lama — bentuk response dipertahankan untuk klien yang sudah
// beredar. Penggantinya: /api/v1/bk/counselor/dashboard (yang juga memuat
// `topStudents`). Lihat docs/api-v1-plan.md.
export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const dashboard = await getCounselorDashboard();
  return NextResponse.json(toDashboard(dashboard));
}
