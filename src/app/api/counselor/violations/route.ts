import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { listViolations, saveViolation } from "@/server/modules/bk/service";
import { toViolation } from "@/server/modules/bk/dto";

// Endpoint versi lama. Penggantinya: /api/v1/bk/counselor/violations.
export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const rows = await listViolations({ take: 50 });
  return NextResponse.json(rows.map(toViolation));
}

export async function POST(req: NextRequest) {
  const r = await requireApiAuth(req, "KESISWAAN");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const body = await req.json().catch(() => ({}));
  const studentId = String(body.studentId ?? "").trim();
  const description = String(body.description ?? "").trim();
  const points = parseInt(String(body.points ?? "0"), 10) || 0;
  const sanction = String(body.sanction ?? "").trim();

  if (!studentId || !description) {
    return NextResponse.json({ error: "Siswa dan deskripsi wajib diisi" }, { status: 400 });
  }

  await saveViolation({
    studentId,
    recordedById: r.user.id,
    description,
    points,
    sanction,
  });

  return NextResponse.json({ success: true });
}
