import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// Tanggapi / ubah status permohonan
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.status ?? "").trim();
  const response = String(body.response ?? "").trim();
  const valid = ["PENDING", "APPROVED", "SCHEDULED", "DONE", "REJECTED"];
  if (!valid.includes(status)) return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });

  await prisma.counselingRequest.update({
    where: { id },
    data: { status: status as "PENDING" | "APPROVED" | "SCHEDULED" | "DONE" | "REJECTED", response: response || null },
  });
  return NextResponse.json({ success: true });
}
