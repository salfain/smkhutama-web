import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { listRequests } from "@/server/modules/bk/service";
import { toRequest } from "@/server/modules/bk/dto";

// Endpoint versi lama. Penggantinya: /api/v1/bk/counselor/requests.
export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const rows = await listRequests();
  return NextResponse.json(rows.map(toRequest));
}
