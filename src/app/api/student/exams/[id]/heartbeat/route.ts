import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

/**
 * Mobile mengirim heartbeat setiap ~30 detik selama ujian berlangsung.
 * Server menyimpan timestamp terakhir heartbeat di loginStatus + updatedAt.
 * Berguna untuk deteksi siswa yang mematikan data tanpa menutup app.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student profile" }, { status: 400 });

  const { id: examId } = await params;

  try {
    const attempt = await prisma.studentExamAttempt.findUnique({
      where: { examId_studentId: { examId, studentId: student.id } },
    });

    if (!attempt) return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });
    if (attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED") {
      return NextResponse.json({ finished: true });
    }
    if (attempt.isLocked) {
      return NextResponse.json({ locked: true, lockReason: attempt.lockReason });
    }

    // Update loginStatus = true dan updatedAt (sebagai timestamp heartbeat terakhir)
    await prisma.studentExamAttempt.update({
      where: { id: attempt.id },
      data: { loginStatus: true },
    });

    return NextResponse.json({ ok: true, locked: false, finished: false });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
