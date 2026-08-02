import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import {
  COUNSELING_STATUSES,
  type CounselingStatus,
  getCase,
  updateCaseStatus,
} from "@/server/modules/bk/service";
import { toCaseDetail } from "@/server/modules/bk/dto";

// Endpoint versi lama. Penggantinya: /api/v1/bk/counselor/cases/{id}.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { id } = await params;
  const record = await getCase(id);
  if (!record) {
    return NextResponse.json({ error: "Sesi konseling tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(toCaseDetail(record));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.status ?? "").trim();

  if (!COUNSELING_STATUSES.includes(status as CounselingStatus)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const updated = await updateCaseStatus(id, status as CounselingStatus);
  if (!updated) {
    return NextResponse.json({ error: "Sesi konseling tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
