import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student profile" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const topic = String(body.topic ?? "").trim();
  const description = String(body.description ?? "").trim();
  const urgency = String(body.urgency ?? "SEDANG").trim();
  const preferredDate = String(body.preferredDate ?? "").trim();
  if (!topic) return NextResponse.json({ error: "Topik wajib diisi" }, { status: 400 });

  await prisma.counselingRequest.create({
    data: {
      studentId: student.id, topic,
      description: description || null, urgency,
      preferredDate: preferredDate ? new Date(preferredDate) : null,
      status: "PENDING",
    },
  });
  return NextResponse.json({ success: true });
}
