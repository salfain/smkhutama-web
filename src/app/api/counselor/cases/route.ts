import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const rows = await prisma.counselingCase.findMany({
    orderBy: { sessionDate: "desc" },
    include: { student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } } },
  });
  return NextResponse.json(rows.map((c) => ({
    id: c.id, studentName: c.student.user.name, className: c.student.class?.name ?? "-",
    type: c.type, status: c.status, title: c.title,
    description: c.description ?? "", notes: c.notes ?? "", followUp: c.followUp ?? "",
    isConfidential: c.isConfidential, sessionDate: c.sessionDate,
  })));
}
