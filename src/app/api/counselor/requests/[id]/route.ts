import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { REQUEST_STATUSES, type RequestStatus, respondRequest } from "@/server/modules/bk/service";

// Endpoint versi lama - tanggapi / ubah status permohonan.
// Penggantinya: PATCH /api/v1/bk/counselor/requests/{id}.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.status ?? "").trim();
  const response = String(body.response ?? "").trim();

  if (!REQUEST_STATUSES.includes(status as RequestStatus)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const updated = await respondRequest(id, status as RequestStatus, response);
  if (!updated) {
    return NextResponse.json({ error: "Permohonan tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
