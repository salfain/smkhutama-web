import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePiketApiAuth } from "@/lib/piket-api-auth";

export async function GET(req: NextRequest) {
  const r = await requirePiketApiAuth(req);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { searchParams } = req.nextUrl;
  const dateStr = searchParams.get("date");
  const d = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(d); start.setHours(0, 0, 0, 0);
  const end   = new Date(d); end.setHours(23, 59, 59, 999);

  const [records, teachers, classes] = await Promise.all([
    prisma.teacherAttendance.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        class: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.teacher.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.class.findMany({ orderBy: [{ grade: "asc" }, { name: "asc" }] }),
  ]);

  return NextResponse.json({
    records: records.map((a) => ({
      id: a.id,
      teacherName: a.teacher.user.name,
      className: a.class.name,
      status: a.status,
      period: a.period,
      substitute: a.substitute,
      note: a.note,
      date: a.date,
    })),
    teachers: teachers.map((t) => ({ id: t.id, name: t.user.name })),
    classes: classes.map((c) => ({ id: c.id, name: c.name })),
  });
}

export async function POST(req: NextRequest) {
  const r = await requirePiketApiAuth(req);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const body = await req.json().catch(() => ({}));
  const { teacherId, classId, status, period, substitute, note } = body;

  if (!teacherId || !classId) {
    return NextResponse.json({ error: "teacherId dan classId wajib diisi" }, { status: 400 });
  }

  const record = await prisma.teacherAttendance.create({
    data: {
      teacherId,
      classId,
      recordedBy: r.user.id,
      status: status || "HADIR",
      period: period || null,
      substitute: substitute || null,
      note: note || null,
    },
  });

  return NextResponse.json({ success: true, id: record.id });
}

export async function DELETE(req: NextRequest) {
  const r = await requirePiketApiAuth(req);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id diperlukan" }, { status: 400 });

  await prisma.teacherAttendance.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
