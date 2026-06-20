import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const r = await requireApiAuth(req, "TEACHER");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  return NextResponse.json(
    { error: "Pembuatan token ujian kini dikelola oleh admin." },
    { status: 403 }
  );
}
