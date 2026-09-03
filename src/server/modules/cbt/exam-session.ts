/**
 * Modul CBT - sesi ujian siswa.
 *
 * Ini jalur paling kritis di seluruh aplikasi: dipakai aplikasi mobile saat
 * ujian sedang berlangsung. Semua aturan akses, siklus attempt, dan
 * penyimpanan jawaban dikumpulkan di sini supaya route API dan halaman web
 * tidak lagi menyimpan dua salinan aturan yang bisa berbeda diam-diam.
 *
 * Kegagalan dikembalikan sebagai **kode**, bukan kalimat. Route lama dan
 * halaman web memetakan kode itu ke pesan masing-masing, sehingga teks error
 * yang sudah dikenal pengguna tidak berubah sementara aturannya tetap satu.
 */

import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { calculateSubmissionScore } from "@/lib/exam-scoring";
import { LOCK_THRESHOLD } from "@/lib/exam-lock";

export type ExamAccessCode =
  | "EXAM_NOT_FOUND"
  | "EXAM_NOT_ACTIVE"
  | "EXAM_NOT_STARTED"
  | "EXAM_ENDED"
  | "NOT_PARTICIPANT";

export type TokenCode = "TOKEN_REQUIRED" | "TOKEN_INVALID" | "TOKEN_EXPIRED";

const SUBMITTED_STATUSES = ["SUBMITTED", "AUTO_SUBMITTED"] as const;

export function isSubmitted(status: string) {
  return (SUBMITTED_STATUSES as readonly string[]).includes(status);
}

// ─── Akses ujian ────────────────────────────────────────────────────────────

export async function findExamWithClasses(examId: string) {
  return prisma.exam.findUnique({ where: { id: examId }, include: { classes: true } });
}

type ExamWindow = { status: string; startAt: Date; endAt: Date; classes: { classId: string }[] };

/**
 * Cek ujian aktif, sedang berada dalam rentang waktunya, dan siswa memang
 * peserta. Ujian tanpa daftar kelas terbuka untuk semua siswa.
 */
export function checkExamAccess(
  exam: ExamWindow | null,
  studentClassId: string | null,
  now = new Date()
): ExamAccessCode | null {
  if (!exam) return "EXAM_NOT_FOUND";
  if (exam.status !== "ACTIVE") return "EXAM_NOT_ACTIVE";
  if (now < exam.startAt) return "EXAM_NOT_STARTED";
  if (now > exam.endAt) return "EXAM_ENDED";
  if (exam.classes.length > 0 && !exam.classes.some((c) => c.classId === studentClassId)) {
    return "NOT_PARTICIPANT";
  }
  return null;
}

/** Token dibandingkan setelah dirapikan: tanpa spasi, huruf besar semua. */
export async function checkExamToken(
  examId: string,
  rawToken: unknown,
  now = new Date()
): Promise<TokenCode | null> {
  const token = String(rawToken ?? "").trim().toUpperCase();
  if (!token) return "TOKEN_REQUIRED";

  const found = await prisma.examToken.findFirst({
    where: { examId, token, isActive: true },
  });
  if (!found) return "TOKEN_INVALID";
  if (found.expiredAt < now) return "TOKEN_EXPIRED";
  return null;
}

// ─── Attempt ────────────────────────────────────────────────────────────────

export async function findAttempt(examId: string, studentId: string) {
  return prisma.studentExamAttempt.findUnique({
    where: { examId_studentId: { examId, studentId } },
  });
}

export type BeginAttemptResult =
  | { status: "ALREADY_SUBMITTED"; attemptId: string }
  | { status: "OK"; attemptId: string; resumed: boolean };

/**
 * Mulai atau lanjutkan attempt. Aman dipanggil berkali-kali: attempt yang
 * sudah berjalan dikembalikan apa adanya, dan yang sudah disubmit ditolak.
 * Pemanggil bertanggung jawab memvalidasi token lebih dulu - API mewajibkan
 * token, sementara halaman web memvalidasinya di langkah terpisah.
 */
export async function beginAttempt(input: {
  examId: string;
  studentId: string;
  userId?: string;
  auditAction: string;
}): Promise<BeginAttemptResult> {
  const existing = await findAttempt(input.examId, input.studentId);

  if (existing) {
    if (isSubmitted(existing.status)) {
      return { status: "ALREADY_SUBMITTED", attemptId: existing.id };
    }
    // Attempt yang dibuat pengawas sebelum ujian dimulai belum punya startedAt.
    if (!existing.startedAt) {
      await prisma.studentExamAttempt.update({
        where: { id: existing.id },
        data: { startedAt: new Date(), status: "IN_PROGRESS", loginStatus: true },
      });
      await logAudit({
        userId: input.userId,
        action: input.auditAction,
        entity: "studentExamAttempt",
        entityId: existing.id,
        details: { examId: input.examId, studentId: input.studentId },
      });
    }
    return { status: "OK", attemptId: existing.id, resumed: true };
  }

  const created = await prisma.studentExamAttempt.create({
    data: {
      examId: input.examId,
      studentId: input.studentId,
      startedAt: new Date(),
      status: "IN_PROGRESS",
      loginStatus: true,
    },
  });
  await logAudit({
    userId: input.userId,
    action: input.auditAction,
    entity: "studentExamAttempt",
    entityId: created.id,
    details: { examId: input.examId, studentId: input.studentId },
  });

  return { status: "OK", attemptId: created.id, resumed: false };
}

/** Ringkasan ujian tanpa isi soal - untuk halaman konfirmasi & token. */
export async function getExamSummary(examId: string) {
  return prisma.exam.findUnique({
    where: { id: examId },
    include: {
      subject: { select: { code: true, name: true } },
      _count: { select: { questions: true } },
    },
  });
}

/** Ujian beserta soal dan pilihannya, urut nomor. */
export async function getExamWithQuestions(examId: string) {
  return prisma.exam.findUnique({
    where: { id: examId },
    include: {
      subject: { select: { code: true, name: true } },
      questions: {
        orderBy: { orderNumber: "asc" },
        include: { question: { include: { options: { orderBy: { orderNumber: "asc" } } } } },
      },
    },
  });
}

/** Attempt beserta jawaban yang sudah tersimpan. */
export async function getAttemptWithAnswers(examId: string, studentId: string) {
  return prisma.studentExamAttempt.findUnique({
    where: { examId_studentId: { examId, studentId } },
    include: {
      answers: {
        select: {
          questionId: true,
          selectedOptionId: true,
          answerText: true,
          isDoubtful: true,
          savedAt: true,
        },
      },
    },
  });
}

// ─── Heartbeat & pelanggaran ────────────────────────────────────────────────

export type HeartbeatResult =
  | { state: "NO_ATTEMPT" }
  | { state: "FINISHED" }
  | { state: "LOCKED"; lockReason: string | null }
  | { state: "OK" };

/**
 * Denyut dari aplikasi mobile tiap ~30 detik. Menyegarkan `loginStatus` dan
 * `updatedAt` supaya pengawas bisa melihat siapa yang koneksinya putus.
 */
export async function recordHeartbeat(examId: string, studentId: string): Promise<HeartbeatResult> {
  const attempt = await findAttempt(examId, studentId);
  if (!attempt) return { state: "NO_ATTEMPT" };
  if (isSubmitted(attempt.status)) return { state: "FINISHED" };
  if (attempt.isLocked) return { state: "LOCKED", lockReason: attempt.lockReason };

  await prisma.studentExamAttempt.update({
    where: { id: attempt.id },
    data: { loginStatus: true },
  });
  return { state: "OK" };
}

export const VIOLATION_LOCK_THRESHOLD = LOCK_THRESHOLD;

/** Batas jumlah pelanggaran offline yang boleh dikirim sekaligus. */
const MAX_OFFLINE_VIOLATIONS = 10;

export type ViolationResult =
  | { state: "NO_ATTEMPT" }
  | { state: "FINISHED"; violationCount: number }
  | { state: "LOCKED"; violationCount: number; lockReason: string | null }
  | { state: "RECORDED"; locked: boolean; violationCount: number; lockReason: string | null };

/**
 * Catat pelanggaran (mis. siswa keluar dari aplikasi) dan kunci attempt bila
 * sudah melewati ambang batas. Pelanggaran yang terjadi saat koneksi putus
 * dikirim menyusul lewat `offlineCount`.
 */
export async function recordViolation(input: {
  examId: string;
  studentId: string;
  userId?: string;
  reason?: string | null;
  offlineCount?: unknown;
}): Promise<ViolationResult> {
  const attempt = await findAttempt(input.examId, input.studentId);
  if (!attempt) return { state: "NO_ATTEMPT" };
  if (isSubmitted(attempt.status)) {
    return { state: "FINISHED", violationCount: attempt.violationCount };
  }
  if (attempt.isLocked) {
    return {
      state: "LOCKED",
      violationCount: attempt.violationCount,
      lockReason: attempt.lockReason,
    };
  }

  const reason = String(input.reason ?? "Keluar aplikasi").trim() || "Keluar aplikasi";
  const requested = Number(input.offlineCount ?? 1);
  const addCount = Math.max(1, Math.min(Number.isFinite(requested) ? requested : 1, MAX_OFFLINE_VIOLATIONS));

  const violationCount = attempt.violationCount + addCount;
  const shouldLock = violationCount >= VIOLATION_LOCK_THRESHOLD;
  const lockReason = addCount > 1 ? `${reason} (${addCount}x saat offline)` : reason;

  const updated = await prisma.studentExamAttempt.update({
    where: { id: attempt.id },
    data: {
      violationCount,
      ...(shouldLock ? { isLocked: true, lockedAt: new Date(), lockReason } : {}),
    },
  });

  if (updated.isLocked) {
    await logAudit({
      userId: input.userId,
      action: "LOCK_EXAM_ATTEMPT",
      entity: "studentExamAttempt",
      entityId: updated.id,
      details: {
        examId: input.examId,
        studentId: input.studentId,
        violationCount: updated.violationCount,
        reason: lockReason,
      },
    });
  }

  return {
    state: "RECORDED",
    locked: updated.isLocked,
    violationCount: updated.violationCount,
    lockReason: updated.lockReason,
  };
}

// ─── Jawaban ────────────────────────────────────────────────────────────────

export type AnswerInput = {
  questionId: string;
  selectedOptionId?: string | null;
  answerText?: string | null;
  isDoubtful?: boolean;
};

export type SaveAnswerResult = "OK" | "NO_ATTEMPT" | "ALREADY_SUBMITTED";

export async function saveAnswer(
  examId: string,
  studentId: string,
  answer: AnswerInput
): Promise<SaveAnswerResult> {
  const attempt = await findAttempt(examId, studentId);
  if (!attempt) return "NO_ATTEMPT";
  if (isSubmitted(attempt.status)) return "ALREADY_SUBMITTED";

  await upsertAnswers(attempt.id, [answer]);
  return "OK";
}

async function upsertAnswers(attemptId: string, answers: AnswerInput[]) {
  await prisma.$transaction(
    answers.map((answer) =>
      prisma.studentAnswer.upsert({
        where: { attemptId_questionId: { attemptId, questionId: answer.questionId } },
        update: {
          selectedOptionId: answer.selectedOptionId ?? null,
          answerText: answer.answerText ?? null,
          isDoubtful: answer.isDoubtful ?? false,
          savedAt: new Date(),
        },
        create: {
          attemptId,
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId ?? null,
          answerText: answer.answerText ?? null,
          isDoubtful: answer.isDoubtful ?? false,
        },
      })
    )
  );
}

export type SyncError = { questionId: string | null; error: string };

export type SyncResult =
  | { state: "NO_ATTEMPT" }
  | { state: "ALREADY_SUBMITTED" }
  | { state: "LOCKED"; lockReason: string | null }
  | { state: "NO_VALID_ANSWERS"; errors: SyncError[] }
  | { state: "OK"; synced: number; errors: SyncError[] };

/**
 * Simpan antrean jawaban yang terkumpul saat aplikasi offline.
 *
 * Setiap jawaban diperiksa: soalnya harus milik ujian ini dan pilihan yang
 * dipilih harus milik soal itu. Jawaban yang lolos tetap disimpan meski ada
 * yang ditolak, supaya satu entri rusak tidak menjatuhkan seluruh antrean.
 */
export async function syncAnswers(
  examId: string,
  studentId: string,
  answers: AnswerInput[]
): Promise<SyncResult> {
  const attempt = await findAttempt(examId, studentId);
  if (!attempt) return { state: "NO_ATTEMPT" };
  if (isSubmitted(attempt.status)) return { state: "ALREADY_SUBMITTED" };
  if (attempt.isLocked) return { state: "LOCKED", lockReason: attempt.lockReason };

  const examQuestions = await prisma.examQuestion.findMany({
    where: { examId },
    include: { question: { select: { id: true, options: { select: { id: true } } } } },
  });
  const questionIds = new Set(examQuestions.map((eq) => eq.questionId));
  const optionOwner = new Map<string, string>();
  for (const eq of examQuestions) {
    for (const option of eq.question.options) optionOwner.set(option.id, eq.questionId);
  }

  const valid: AnswerInput[] = [];
  const errors: SyncError[] = [];

  for (const answer of answers) {
    const questionId = String(answer.questionId ?? "").trim();
    const selectedOptionId = answer.selectedOptionId
      ? String(answer.selectedOptionId).trim()
      : null;

    if (!questionId) {
      errors.push({ questionId: null, error: "questionId wajib" });
      continue;
    }
    if (!questionIds.has(questionId)) {
      errors.push({ questionId, error: "Soal bukan bagian dari ujian ini" });
      continue;
    }
    if (selectedOptionId && optionOwner.get(selectedOptionId) !== questionId) {
      errors.push({ questionId, error: "Pilihan jawaban tidak sesuai soal" });
      continue;
    }

    valid.push({
      questionId,
      selectedOptionId,
      answerText: answer.answerText ?? null,
      isDoubtful: answer.isDoubtful ?? false,
    });
  }

  if (valid.length === 0) return { state: "NO_VALID_ANSWERS", errors };

  await upsertAnswers(attempt.id, valid);
  return { state: "OK", synced: valid.length, errors };
}

// ─── Submit ─────────────────────────────────────────────────────────────────

export type SubmitResult =
  | { state: "NO_ATTEMPT" }
  | { state: "ALREADY_SUBMITTED"; score: number | null }
  | { state: "OK"; score: number | null };

/**
 * Kunci jawaban dinilai di sini, lalu status attempt dan seluruh nilai per
 * soal ditulis dalam satu transaksi - supaya tidak pernah ada attempt yang
 * berstatus terkirim tapi nilainya setengah jadi.
 *
 * Soal esai/uraian membuat `finalScore` bernilai null sampai guru menilai;
 * lihat `calculateFinalScoreAfterManual` di `src/lib/exam-scoring.ts`.
 */
export async function submitAttempt(input: {
  examId: string;
  studentId: string;
  userId?: string;
  isAuto: boolean;
  auditAction: string;
}): Promise<SubmitResult> {
  const attempt = await prisma.studentExamAttempt.findUnique({
    where: { examId_studentId: { examId: input.examId, studentId: input.studentId } },
    include: {
      answers: { include: { question: { include: { options: true } } } },
      exam: {
        select: {
          multipleChoicePercentage: true,
          essayPercentage: true,
          questions: {
            include: { question: { select: { id: true, scoreWeight: true, questionType: true } } },
          },
        },
      },
    },
  });

  if (!attempt) return { state: "NO_ATTEMPT" };
  if (isSubmitted(attempt.status)) {
    return { state: "ALREADY_SUBMITTED", score: attempt.score };
  }

  const { updates, finalScore } = calculateSubmissionScore({
    questions: attempt.exam.questions.map((eq) => eq.question),
    answers: attempt.answers,
    multipleChoicePercentage: attempt.exam.multipleChoicePercentage,
    essayPercentage: attempt.exam.essayPercentage,
  });

  await prisma.$transaction([
    ...updates.map((u) =>
      prisma.studentAnswer.update({
        where: { id: u.id },
        data: { isCorrect: u.isCorrect, score: u.score },
      })
    ),
    prisma.studentExamAttempt.update({
      where: { id: attempt.id },
      data: {
        status: input.isAuto ? "AUTO_SUBMITTED" : "SUBMITTED",
        submittedAt: new Date(),
        score: finalScore,
        loginStatus: false,
      },
    }),
  ]);

  await logAudit({
    userId: input.userId,
    action: input.auditAction,
    entity: "studentExamAttempt",
    entityId: attempt.id,
    details: { examId: input.examId, studentId: input.studentId, score: finalScore },
  });

  return { state: "OK", score: finalScore };
}
