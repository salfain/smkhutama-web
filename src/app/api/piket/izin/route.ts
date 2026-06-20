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

  const [records, students] = await Promise.all([
    prisma.studentPermit.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            class: { select: { name: true } },
            major: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.student.findMany({
      include: { user: { select: { name: true } }, class: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  return NextResponse.json({
    records: records.map((p) => ({
      id: p.id,
      studentName: p.student.user.name,
      className: p.student.class?.name ?? "—",
      major: p.student.major?.name ?? "-",
      reason: p.reason,
      exitTime: p.exitTime,
      returnTime: p.returnTime,
      status: p.status,
      date: p.date,
    })),
    students: students.map((s) => ({
      id: s.id,
      name: s.user.name,
      className: s.class?.name ?? "—",
      nis: s.nis,
    })),
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

  const record = await prisma.studentPermit.create({
    data: {
      studentId,
      recordedBy: r.user.id,
      type: "KELUAR",
      reason,
      exitTime: new Date(),
      status: "KELUAR",
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

  await prisma.studentPermit.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
