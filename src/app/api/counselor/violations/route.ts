import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const rows = await prisma.violationRecord.findMany({
    orderBy: { date: "desc" }, take: 50,
    include: {
      student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } },
      violationType: { select: { name: true } },
    },
  });
  return NextResponse.json(rows.map((v) => ({
    id: v.id, studentName: v.student.user.name, className: v.student.class?.name ?? "-",
    typeName: v.violationType?.name ?? null, description: v.description,
    points: v.points, sanction: v.sanction ?? "", date: v.date,
  })));
}

export async function POST(req: NextRequest) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const user = r.user;
  let counselor = await prisma.counselor.findUnique({ where: { userId: user.id } });
  if (!counselor) counselor = await prisma.counselor.create({ data: { userId: user.id } });

  const body = await req.json().catch(() => ({}));
  const studentId = String(body.studentId ?? "").trim();
  const description = String(body.description ?? "").trim();
  const points = parseInt(String(body.points ?? "0"), 10) || 0;
  const sanction = String(body.sanction ?? "").trim();
  if (!studentId || !description) return NextResponse.json({ error: "Siswa dan deskripsi wajib diisi" }, { status: 400 });

  await prisma.violationRecord.create({
    data: { studentId, counselorId: counselor.id, description, points, sanction: sanction || null, date: new Date() },
  });
  return NextResponse.json({ success: true });
}
