import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { listStudentsWithPoints } from "@/server/modules/bk/service";
import { toStudentWithPoints } from "@/server/modules/bk/dto";

// Endpoint versi lama. Penggantinya: /api/v1/bk/counselor/students/book.
export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const students = await listStudentsWithPoints();
  return NextResponse.json(students.map(toStudentWithPoints));
}
