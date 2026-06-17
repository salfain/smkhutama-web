import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const rows = await prisma.achievementRecord.findMany({
    orderBy: { date: "desc" }, take: 50,
    include: { student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } } },
  });
  return NextResponse.json(rows.map((a) => ({
    id: a.id, studentName: a.student.user.name, className: a.student.class?.name ?? "-",
    title: a.title, description: a.description ?? "", points: a.points,
    level: a.level ?? "", date: a.date,
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
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const points = parseInt(String(body.points ?? "0"), 10) || 0;
  const level = String(body.level ?? "").trim();
  if (!studentId || !title) return NextResponse.json({ error: "Siswa dan judul wajib diisi" }, { status: 400 });

  await prisma.achievementRecord.create({
    data: { studentId, counselorId: counselor.id, title, description: description || null, points, level: level || null, date: new Date() },
  });
  return NextResponse.json({ success: true });
}
