import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const students = await prisma.student.findMany({
    include: {
      user: { select: { name: true } },
      class: { select: { name: true } },
      violationRecords: { select: { points: true } },
      achievementRecords: { select: { points: true } },
      counselingCases: { select: { id: true } },
    },
    orderBy: { user: { name: "asc" } },
  });

  return NextResponse.json(students.map((s) => ({
    id: s.id, 
    name: s.user.name, 
    nis: s.nis ?? "", 
    className: s.class?.name ?? "-",
    violationPoints: s.violationRecords.reduce((a, v) => a + v.points, 0),
    achievementPoints: s.achievementRecords.reduce((a, v) => a + v.points, 0),
    cases: s.counselingCases.length,
  })));
}
