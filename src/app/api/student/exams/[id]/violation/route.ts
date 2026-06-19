import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { LOCK_THRESHOLD } from "@/lib/exam-lock";
import { logAudit } from "@/lib/audit";

/**
 * Mobile melaporkan pelanggaran (misal siswa keluar app).
 * Server menambah counter dan mengunci attempt bila melewati ambang batas.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student profile" }, { status: 400 });

  const { id: examId } = await params;
  const body = await req.json().catch(() => ({}));
  const reason = String(body.reason ?? "Keluar aplikasi").trim();
  // offlineCount: jumlah pelanggaran yang terjadi saat offline (dikirim setelah koneksi pulih)
  const offlineCount = Math.min(Number(body.offlineCount ?? 1), 10); // max 10 sekaligus
  const addCount = Math.max(1, offlineCount);

  const attempt = await prisma.studentExamAttempt.findUnique({
    where: { examId_studentId: { examId, studentId: student.id } },
  });
  if (!attempt) return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });

  // Jika sudah submit atau sudah dikunci, jangan ubah counter
  if (attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED") {
    return NextResponse.json({ locked: false, finished: true, violationCount: attempt.violationCount });
  }
  if (attempt.isLocked) {
    return NextResponse.json({ locked: true, violationCount: attempt.violationCount, lockReason: attempt.lockReason });
  }

  const nextCount = attempt.violationCount + addCount;
  const shouldLock = nextCount >= LOCK_THRESHOLD;
  // Jika multiple offline violations, sebut di lockReason
  const finalReason = addCount > 1
    ? `${reason} (${addCount}x saat offline)`
    : reason;

  const updated = await prisma.studentExamAttempt.update({
    where: { id: attempt.id },
    data: {
      violationCount: nextCount,
      ...(shouldLock ? { isLocked: true, lockedAt: new Date(), lockReason: finalReason } : {}),
    },
  });

  if (updated.isLocked) {
    await logAudit({
      userId: r.user.id,
      action: "LOCK_EXAM_ATTEMPT",
      entity: "studentExamAttempt",
      entityId: updated.id,
      details: { examId, studentId: student.id, violationCount: updated.violationCount, reason: finalReason },
    });
  }

  return NextResponse.json({
    locked: updated.isLocked,
    violationCount: updated.violationCount,
    threshold: LOCK_THRESHOLD,
    lockReason: updated.lockReason,
  });
}
