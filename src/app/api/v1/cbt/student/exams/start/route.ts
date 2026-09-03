import type { NextRequest } from "next/server";
import { apiOk, handle, preflight, readJson, requiredString } from "@/server/http";
import { requireStudent } from "@/server/auth";
import {
  beginAttempt,
  checkExamAccess,
  checkExamToken,
  findAttempt,
  findExamWithClasses,
  isSubmitted,
} from "@/server/modules/cbt/exam-session";
import { alreadySubmitted, examAccessError, examTokenError } from "@/server/modules/cbt/http-errors";

/**
 * POST /api/v1/cbt/student/exams/start - mulai atau lanjutkan ujian.
 *
 * Aman dipanggil ulang: kalau attempt-nya sudah berjalan, yang dikembalikan
 * attempt yang sama, bukan yang baru. Token hanya diminta saat ujian benar-
 * benar dimulai; siswa yang aplikasinya tertutup di tengah ujian bisa
 * melanjutkan tanpa meminta token lagi ke pengawas.
 */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const { actor, student } = await requireStudent(req);
    const body = await readJson(req);
    const examId = requiredString(body, "examId");
    const now = new Date();

    const exam = await findExamWithClasses(examId);
    const accessCode = checkExamAccess(exam, student.classId, now);
    if (accessCode) throw examAccessError(accessCode);

    const existing = await findAttempt(examId, student.id);
    if (existing && isSubmitted(existing.status)) throw alreadySubmitted();

    if (!existing?.startedAt) {
      const tokenCode = await checkExamToken(examId, body.token, now);
      if (tokenCode) throw examTokenError(tokenCode);
    }

    const result = await beginAttempt({
      examId,
      studentId: student.id,
      userId: actor.id,
      auditAction: "API_START_EXAM_ATTEMPT",
    });
    if (result.status === "ALREADY_SUBMITTED") throw alreadySubmitted();

    return apiOk({ attemptId: result.attemptId, resumed: result.resumed });
  });
}

export async function OPTIONS() {
  return preflight();
}
