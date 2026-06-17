import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { id } = await params;

  const s = await prisma.student.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      class: { select: { name: true } },
      major: { select: { name: true } },
      violationRecords: { orderBy: { date: "desc" }, include: { violationType: { select: { name: true } } } },
      achievementRecords: { orderBy: { date: "desc" } },
      counselingCases: { orderBy: { sessionDate: "desc" } },
      homeVisits: { orderBy: { visitDate: "desc" } },
      parentSummons: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!s) return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });

  const violationPoints = s.violationRecords.reduce((a, v) => a + v.points, 0);
  const achievementPoints = s.achievementRecords.reduce((a, v) => a + v.points, 0);

  return NextResponse.json({
    id: s.id, 
    name: s.user.name, 
    nis: s.nis ?? "", 
    nisn: s.nisn ?? "",
    className: s.class?.name ?? "-", 
    major: s.major?.name ?? "-",
    gender: s.gender, 
    violationPoints, 
    achievementPoints, 
    netPoints: achievementPoints - violationPoints,
    violations: s.violationRecords.map((v) => ({ 
      id: v.id, 
      typeName: v.violationType?.name ?? null, 
      description: v.description, 
      points: v.points, 
      sanction: v.sanction ?? "", 
      date: v.date 
    })),
    achievements: s.achievementRecords.map((a) => ({ 
      id: a.id, 
      title: a.title, 
      description: a.description ?? "", 
      points: a.points, 
      level: a.level ?? "", 
      date: a.date 
    })),
    cases: s.counselingCases.map((c) => ({ 
      id: c.id, 
      title: c.title, 
      type: c.type, 
      status: c.status, 
      sessionDate: c.sessionDate 
    })),
    homeVisits: s.homeVisits.map((h) => ({ 
      id: h.id, 
      purpose: h.purpose, 
      visitDate: h.visitDate, 
      result: h.result ?? "" 
    })),
    summons: s.parentSummons.map((p) => ({ 
      id: p.id, 
      level: p.level, 
      reason: p.reason, 
      status: p.status, 
      createdAt: p.createdAt 
    })),
  });
}
