import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student profile" }, { status: 400 });
  const studentId = student.id;

  const [violations, achievements, cases, requests] = await Promise.all([
    prisma.violationRecord.findMany({
      where: { studentId }, orderBy: { date: "desc" },
      include: { violationType: { select: { name: true } } },
    }),
    prisma.achievementRecord.findMany({ where: { studentId }, orderBy: { date: "desc" } }),
    prisma.counselingCase.findMany({ where: { studentId }, orderBy: { sessionDate: "desc" } }),
    prisma.counselingRequest.findMany({ where: { studentId }, orderBy: { createdAt: "desc" } }),
  ]);

  const violationPoints = violations.reduce((s, v) => s + v.points, 0);
  const achievementPoints = achievements.reduce((s, a) => s + a.points, 0);

  return NextResponse.json({
    violationPoints,
    achievementPoints,
    netPoints: achievementPoints - violationPoints,
    violations: violations.map((v) => ({
      id: v.id, typeName: v.violationType?.name ?? null, description: v.description,
      points: v.points, sanction: v.sanction ?? "", date: v.date,
    })),
    achievements: achievements.map((a) => ({
      id: a.id, title: a.title, description: a.description ?? "", points: a.points,
      level: a.level ?? "", date: a.date,
    })),
    cases: cases.map((c) => ({
      id: c.id, title: c.title, type: c.type, status: c.status,
      description: c.isConfidential ? null : (c.description ?? ""),
      isConfidential: c.isConfidential, sessionDate: c.sessionDate,
    })),
    requests: requests.map((r) => ({
      id: r.id, topic: r.topic, description: r.description ?? "", urgency: r.urgency,
      status: r.status, response: r.response ?? "", preferredDate: r.preferredDate, createdAt: r.createdAt,
    })),
  });
}
