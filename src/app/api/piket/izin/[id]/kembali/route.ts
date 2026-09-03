import { NextRequest, NextResponse } from "next/server";
import { requirePiketApiAuth } from "@/lib/piket-api-auth";
import { markPermitReturned } from "@/server/modules/piket/service";

// Endpoint versi lama - bentuk response dipertahankan untuk aplikasi mobile
// yang sudah beredar. Penggantinya: PATCH /api/v1/piket/izin/{id}/kembali.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,PATCH,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: corsHeaders });
}

async function markReturned(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requirePiketApiAuth(req);
  if ("error" in r) return json({ error: r.error }, r.status);

  const { id } = await params;
  if (!id) return json({ error: "id diperlukan" }, 400);

  const updated = await markPermitReturned(id);
  if (!updated) return json({ error: "Catatan izin tidak ditemukan" }, 404);

  return json({ success: true });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return markReturned(req, ctx);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return markReturned(req, ctx);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
