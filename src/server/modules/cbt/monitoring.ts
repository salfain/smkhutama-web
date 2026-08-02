/**
 * Modul CBT — pengawasan ujian.
 *
 * Guru memantau ujiannya sendiri, admin memantau seluruh ujian aktif.
 * Kendali attempt (buka kunci, kumpulkan paksa, reset login) sebelumnya
 * ditulis dua kali — di `admin/monitoring/actions.ts` dan
 * `teacher/monitoring/actions.ts` — dengan perbedaan halus pada nama aksi
 * audit. Sekarang satu, dengan nama aksi diserahkan ke pemanggil.
 */

import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { isSubmitted } from "./exam-session";

const STUDENT_WITH_CLASS = {
  user: { select: { name: true } },
  class: { select: { name: true } },
} as const;

// ─── Tampilan pengawasan: guru ──────────────────────────────────────────────

/** Ujian milik guru beserta hitungan soal; null bila bukan miliknya. */
export async function findTeacherExam(examId: string, teacherId: string) {
  return prisma.exam.findFirst({
    where: { id: examId, teacherId },
    include: { _count: { select: { questions: true } } },
  });
}

export async function listAttemptsForExam(examId: string) {
  return prisma.studentExamAttempt.findMany({
    where: { examId },
    include: {
      student: { include: STUDENT_WITH_CLASS },
      _count: { select: { answers: true } },
    },
  });
}

/** Ujian aktif milik guru lengkap dengan peserta — dipakai halaman monitoring. */
export async function listTeacherActiveExams(teacherId: string) {
  return prisma.exam.findMany({
    where: { teacherId, status: "ACTIVE" },
    orderBy: { startAt: "desc" },
    include: {
      subject: { select: { code: true } },
      _count: { select: { questions: true, attempts: true } },
      attempts: {
        include: {
          student: { include: STUDENT_WITH_CLASS },
          _count: { select: { answers: true } },
        },
      },
    },
  });
}

// ─── Tampilan pengawasan: admin ─────────────────────────────────────────────

export async function listActiveExams() {
  return prisma.exam.findMany({
    where: { status: "ACTIVE" },
    orderBy: { startAt: "desc" },
    include: {
      subject: { select: { code: true } },
      teacher: { include: { user: { select: { name: true } } } },
      _count: { select: { attempts: true } },
    },
  });
}

/**
 * Pengawasan satu ujian dari sisi admin: seluruh siswa di kelas peserta,
 * termasuk yang belum memulai — supaya pengawas tahu siapa yang belum masuk.
 * Tanpa `examId`, dipilih ujian aktif terbaru.
 */
export async function getExamMonitoring(examId: string | null) {
  let targetId = examId;

  if (!targetId) {
    const firstActive = await prisma.exam.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { startAt: "desc" },
      select: { id: true },
    });
    if (!firstActive) return null;
    targetId = firstActive.id;
  }

  const exam = await prisma.exam.findUnique({
    where: { id: targetId },
    include: {
      subject: { select: { code: true, name: true } },
      teacher: { include: { user: { select: { name: true } } } },
      classes: { include: { class: { select: { id: true, name: true } } } },
      _count: { select: { questions: true } },
    },
  });
  if (!exam) return null;

  const classIds = exam.classes.map((c) => c.class.id);
  const students = await prisma.student.findMany({
    where: classIds.length > 0 ? { classId: { in: classIds } } : {},
    include: {
      user: { select: { name: true, isActive: true } },
      class: { select: { name: true } },
      attempts: {
        where: { examId: targetId },
        include: { _count: { select: { answers: true } } },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  return { exam, students };
}

// ─── Kendali attempt ────────────────────────────────────────────────────────

export async function findAttemptWithExam(attemptId: string) {
  return prisma.studentExamAttempt.findUnique({
    where: { id: attemptId },
    include: { exam: { select: { id: true, teacherId: true } } },
  });
}

export type AttemptControlResult = "OK" | "NOT_FOUND" | "ALREADY_SUBMITTED";

/** Buka kunci attempt yang terkunci anti-curang; hitungan pelanggaran direset. */
export async function unlockAttempt(
  attemptId: string,
  auditAction: string
): Promise<AttemptControlResult> {
  const attempt = await prisma.studentExamAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) return "NOT_FOUND";

  const updated = await prisma.studentExamAttempt.update({
    where: { id: attemptId },
    data: { isLocked: false, lockedAt: null, lockReason: null, violationCount: 0 },
  });

  await logAudit({
    action: auditAction,
    entity: "studentExamAttempt",
    entityId: attemptId,
    details: { examId: updated.examId, studentId: updated.studentId },
  });

  return "OK";
}

/**
 * Kumpulkan paksa attempt yang sedang berjalan.
 *
 * Jawaban yang sudah tersimpan tidak dinilai ulang di sini — statusnya
 * diubah jadi AUTO_SUBMITTED dan dikunci supaya siswa tidak bisa melanjutkan.
 */
export async function forceSubmitAttempt(
  attemptId: string,
  auditAction: string
): Promise<AttemptControlResult> {
  const attempt = await prisma.studentExamAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) return "NOT_FOUND";
  if (isSubmitted(attempt.status)) return "ALREADY_SUBMITTED";

  const updated = await prisma.studentExamAttempt.update({
    where: { id: attemptId },
    data: {
      status: "AUTO_SUBMITTED",
      submittedAt: new Date(),
      isLocked: true,
      lockReason: attempt.lockReason ?? "Dikumpulkan paksa oleh pengawas",
    },
  });

  await logAudit({
    action: auditAction,
    entity: "studentExamAttempt",
    entityId: attemptId,
    details: {
      examId: updated.examId,
      studentId: updated.studentId,
      previousStatus: attempt.status,
    },
  });

  return "OK";
}

/**
 * Kembalikan attempt ke keadaan belum mulai, mis. saat siswa salah perangkat.
 * Jawaban yang sudah tersimpan tidak dihapus.
 */
export async function resetAttemptLogin(
  attemptId: string,
  auditAction: string
): Promise<AttemptControlResult> {
  const attempt = await prisma.studentExamAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) return "NOT_FOUND";

  const updated = await prisma.studentExamAttempt.update({
    where: { id: attemptId },
    data: { status: "NOT_STARTED", loginStatus: false, startedAt: null },
  });

  await logAudit({
    action: auditAction,
    entity: "studentExamAttempt",
    entityId: attemptId,
    details: { examId: updated.examId, studentId: updated.studentId },
  });

  return "OK";
}
