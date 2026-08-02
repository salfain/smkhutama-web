import { NextRequest, NextResponse } from "next/server";
import { requirePiketApiAuth } from "@/lib/piket-api-auth";
import { createTardiness, deleteTardiness, listTardiness } from "@/server/modules/piket/service";
import { toStudentOption, toTardiness } from "@/server/modules/piket/dto";

// Endpoint versi lama — bentuk response dipertahankan untuk aplikasi mobile
// yang sudah beredar. Penggantinya: /api/v1/piket/terlambat.
export async function GET(req: NextRequest) {
  const r = await requirePiketApiAuth(req);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { records, students } = await listTardiness(req.nextUrl.searchParams.get("date"));

  return NextResponse.json({
    records: records.map(toTardiness),
    students: students.map(toStudentOption),
  });
}

export async function POST(req: NextRequest) {
  const r = await requirePiketApiAuth(req);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const body = await req.json().catch(() => ({}));
  const { studentId, reason, sanction, arrivalTime, date } = body;

  if (!studentId) return NextResponse.json({ error: "studentId wajib diisi" }, { status: 400 });

  const record = await createTardiness({
    studentId,
    recordedBy: r.user.id,
    reason,
    sanction,
    arrivalTime,
    date,
  });

  return NextResponse.json({ success: true, id: record.id });
}

export async function DELETE(req: NextRequest) {
  const r = await requirePiketApiAuth(req);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id diperlukan" }, { status: 400 });

  await deleteTardiness(id);
  return NextResponse.json({ success: true });
}
