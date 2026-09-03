import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { recordHeartbeat } from "@/server/modules/cbt/exam-session";

/**
 * Endpoint versi lama - mobile mengirim heartbeat tiap ~30 detik selama ujian
 * berlangsung, berguna untuk mendeteksi siswa yang koneksinya putus tanpa
 * menutup aplikasi.
 * Penggantinya: POST /api/v1/cbt/student/exams/{id}/heartbeat.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student profile" }, { status: 400 });

  const { id: examId } = await params;

  try {
    const result = await recordHeartbeat(examId, student.id);

    if (result.state === "NO_ATTEMPT") {
      return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });
    }
    if (result.state === "FINISHED") return NextResponse.json({ finished: true });
    if (result.state === "LOCKED") {
      return NextResponse.json({ locked: true, lockReason: result.lockReason });
    }

    return NextResponse.json({ ok: true, locked: false, finished: false });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
