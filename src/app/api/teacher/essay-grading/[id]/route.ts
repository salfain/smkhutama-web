import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { gradeEssay } from "@/server/modules/cbt/teacher";

// Endpoint versi lama.
// Penggantinya: PATCH /api/v1/cbt/teacher/essay-grading/{id}.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "TEACHER");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const teacher = r.user.teacher;
  if (!teacher) return NextResponse.json({ error: "No teacher" }, { status: 400 });

  const { id: answerId } = await params;
  const { score } = await req.json();
  if (typeof score !== "number" || score < 0 || score > 100) {
    return NextResponse.json({ error: "Nilai harus 0-100" }, { status: 400 });
  }

  const result = await gradeEssay({ answerId, teacherId: teacher.id, score });

  if (result === "NOT_FOUND") {
    return NextResponse.json({ error: "Jawaban tidak ditemukan" }, { status: 404 });
  }
  if (result === "FORBIDDEN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
