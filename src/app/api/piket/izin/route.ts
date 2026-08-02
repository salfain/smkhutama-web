import { NextRequest, NextResponse } from "next/server";
import { requirePiketApiAuth } from "@/lib/piket-api-auth";
import { createPermit, deletePermit, listPermits } from "@/server/modules/piket/service";
import { toPermit, toStudentOption } from "@/server/modules/piket/dto";

// Endpoint versi lama — bentuk response dipertahankan untuk aplikasi mobile
// yang sudah beredar. Penggantinya: /api/v1/piket/izin.
export async function GET(req: NextRequest) {
  const r = await requirePiketApiAuth(req);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { records, students } = await listPermits(req.nextUrl.searchParams.get("date"));

  return NextResponse.json({
    records: records.map(toPermit),
    students: students.map(toStudentOption),
  });
}

export async function POST(req: NextRequest) {
  const r = await requirePiketApiAuth(req);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const body = await req.json().catch(() => ({}));
  const { studentId, reason } = body;

  if (!studentId || !reason) {
    return NextResponse.json({ error: "studentId dan reason wajib diisi" }, { status: 400 });
  }

  const record = await createPermit({ studentId, reason, recordedBy: r.user.id });

  return NextResponse.json({ success: true, id: record.id });
}

export async function DELETE(req: NextRequest) {
  const r = await requirePiketApiAuth(req);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id diperlukan" }, { status: 400 });

  await deletePermit(id);
  return NextResponse.json({ success: true });
}
