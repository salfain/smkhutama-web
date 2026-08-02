import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { getTeacherCounts } from "@/server/modules/cbt/teacher";
import { toTeacherStats } from "@/server/modules/cbt/dto";

// Endpoint versi lama. Penggantinya: /api/v1/cbt/teacher/dashboard.
export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "TEACHER");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const teacher = r.user.teacher;
  if (!teacher) return NextResponse.json({ error: "No teacher profile" }, { status: 400 });

  const counts = await getTeacherCounts(teacher.id);
  return NextResponse.json(toTeacherStats(counts));
}
