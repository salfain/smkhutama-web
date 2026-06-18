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

  const records = await prisma.studentTardiness.findMany({
    where: { date: { gte: start, lte: end } },
    include: {
      student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } }
    },
    orderBy: { createdAt: "desc" },
  });

  const students = await prisma.student.findMany({
    include: { user: { select: { name: true } }, class: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });

  return NextResponse.json({
    records: records.map((r) => ({
      id: r.id,
      studentName: r.student.user.name,
      className: r.student.class?.name ?? "—",
      arrivalTime: r.arrivalTime,
      reason: r.reason,
      sanction: r.sanction,
      date: r.date,
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
  const { studentId, reason, sanction, arrivalTime } = body;

  if (!studentId) return NextResponse.json({ error: "studentId wajib diisi" }, { status: 400 });

  let at: Date;
  if (arrivalTime) {
    // Bisa berupa "HH:mm" atau ISO string
    if (/^\d{2}:\d{2}$/.test(String(arrivalTime))) {
      const today = new Date().toISOString().slice(0, 10);
      at = new Date(`${today}T${arrivalTime}:00`);
    } else {
      at = new Date(arrivalTime);
    }
  } else {
    at = new Date();
  }
  if (isNaN(at.getTime())) at = new Date();

  const record = await prisma.studentTardiness.create({
    data: {
      studentId,
      recordedBy: r.user.id,
      arrivalTime: at,
      reason: reason || null,
      sanction: sanction || null,
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

  await prisma.studentTardiness.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
