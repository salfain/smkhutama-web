import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { getDashboard } from "@/server/modules/cbt/student";

// Endpoint versi lama. Penggantinya: /api/v1/cbt/student/dashboard.
export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student profile" }, { status: 400 });

  return NextResponse.json(await getDashboard(student));
}
