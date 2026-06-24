import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "REFERRED"] as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { id } = await params;
  const c = await prisma.counselingCase.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          user: { select: { name: true } },
          class: { select: { name: true } },
        },
      },
      counselor: { include: { user: { select: { name: true } } } },
    },
  });

  if (!c) return NextResponse.json({ error: "Sesi konseling tidak ditemukan" }, { status: 404 });

  return NextResponse.json({
    id: c.id,
    studentId: c.studentId,
    studentName: c.student.user.name,
    className: c.student.class?.name ?? "-",
    counselorName: c.counselor.user.name,
    type: c.type,
    status: c.status,
    title: c.title,
    description: c.description ?? "",
    notes: c.notes ?? "",
    followUp: c.followUp ?? "",
    isConfidential: c.isConfidential,
    sessionDate: c.sessionDate,
    sessions: [],
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.status ?? "").trim();

  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  try {
    await prisma.counselingCase.update({
      where: { id },
      data: { status: status as (typeof VALID_STATUSES)[number] },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Sesi konseling tidak ditemukan" }, { status: 404 });
  }
}
