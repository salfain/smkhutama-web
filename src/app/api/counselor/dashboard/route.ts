import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const [openCases, totalCases, totalViolations, totalAchievements, pendingRequests, recentCases] = await Promise.all([
    prisma.counselingCase.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.counselingCase.count(),
    prisma.violationRecord.count(),
    prisma.achievementRecord.count(),
    prisma.counselingRequest.count({ where: { status: "PENDING" } }),
    prisma.counselingCase.findMany({
      take: 5, orderBy: { sessionDate: "desc" },
      include: { student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } } },
    }),
  ]);

  return NextResponse.json({
    openCases, totalCases, totalViolations, totalAchievements, pendingRequests,
    recentCases: recentCases.map((c) => ({
      id: c.id, title: c.title, type: c.type, status: c.status,
      studentName: c.student.user.name, className: c.student.class?.name ?? "-", sessionDate: c.sessionDate,
    })),
  });
}
