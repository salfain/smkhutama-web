import { NextRequest, NextResponse } from "next/server";
import { requirePiketApiAuth } from "@/lib/piket-api-auth";
import { createAttendance, deleteAttendance, listAttendance } from "@/server/modules/piket/service";
import { toAttendance, toClassOption, toTeacherOption } from "@/server/modules/piket/dto";

// Endpoint versi lama - bentuk response dipertahankan untuk aplikasi mobile
// yang sudah beredar. Penggantinya: /api/v1/piket/guru.
export async function GET(req: NextRequest) {
  const r = await requirePiketApiAuth(req);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { records, teachers, classes } = await listAttendance(
    req.nextUrl.searchParams.get("date")
  );

  return NextResponse.json({
    records: records.map(toAttendance),
    teachers: teachers.map(toTeacherOption),
    classes: classes.map(toClassOption),
  });
}

export async function POST(req: NextRequest) {
  const r = await requirePiketApiAuth(req);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const body = await req.json().catch(() => ({}));
  const { teacherId, classId, status, period, substitute, note, date } = body;

  if (!teacherId || !classId) {
    return NextResponse.json({ error: "teacherId dan classId wajib diisi" }, { status: 400 });
  }

  const record = await createAttendance({
    teacherId,
    classId,
    recordedBy: r.user.id,
    status,
    period,
    substitute,
    note,
    date,
  });

  return NextResponse.json({ success: true, id: record.id });
}

export async function DELETE(req: NextRequest) {
  const r = await requirePiketApiAuth(req);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id diperlukan" }, { status: 400 });

  await deleteAttendance(id);
  return NextResponse.json({ success: true });
}
