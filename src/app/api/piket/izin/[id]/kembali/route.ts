import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePiketApiAuth } from "@/lib/piket-api-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requirePiketApiAuth(req);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { id } = await params;
  await prisma.studentPermit.update({
    where: { id },
    data: { status: "SUDAH_KEMBALI", returnTime: new Date() },
  });

  return NextResponse.json({ success: true });
}
