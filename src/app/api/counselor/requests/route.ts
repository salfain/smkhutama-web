import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const rows = await prisma.counselingRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } } },
  });
  return NextResponse.json(rows.map((q) => ({
    id: q.id, studentName: q.student.user.name, className: q.student.class?.name ?? "-",
    topic: q.topic, description: q.description ?? "", urgency: q.urgency,
    status: q.status, response: q.response ?? "", preferredDate: q.preferredDate, createdAt: q.createdAt,
  })));
}
