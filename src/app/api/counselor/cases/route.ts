import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { listCases } from "@/server/modules/bk/service";
import { toCase } from "@/server/modules/bk/dto";

// Endpoint versi lama. Penggantinya: /api/v1/bk/counselor/cases.
export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const cases = await listCases();
  return NextResponse.json(cases.map(toCase));
}
