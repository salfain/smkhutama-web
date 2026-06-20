import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePiketApiAuth } from "@/lib/piket-api-auth";

export async function GET(req: NextRequest) {
  const r = await requirePiketApiAuth(req);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const dateStr = req.nextUrl.searchParams.get("date");
  const date = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end   = new Date(date); end.setHours(23, 59, 59, 999);

  const [tardiness, permits, absences, activePermits] = await Promise.all([
    prisma.studentTardiness.count({ where: { date: { gte: start, lte: end } } }),
    prisma.studentPermit.count({ where: { date: { gte: start, lte: end }, status: "KELUAR" } }),
    prisma.teacherAttendance.count({ where: { date: { gte: start, lte: end }, status: { not: "HADIR" } } }),
    prisma.studentPermit.findMany({
      where: { date: { gte: start, lte: end }, status: "KELUAR" },
      include: {
        student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } }
      },
      orderBy: { exitTime: "asc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    tardiness, permits, absences,
    activePermits: activePermits.map((p) => ({
      id: p.id,
      studentName: p.student.user.name,
      className: p.student.class?.name ?? "—",
      reason: p.reason,
      exitTime: p.exitTime,
    })),
  });
}
