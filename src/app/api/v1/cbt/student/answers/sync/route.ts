import type { NextRequest } from "next/server";
import { apiOk, badRequest, handle, preflight, readJson, requiredString } from "@/server/http";
import { requireStudent } from "@/server/auth";
import { type AnswerInput, syncAnswers } from "@/server/modules/cbt/exam-session";
import { alreadySubmitted, attemptLocked, attemptNotFound } from "@/server/modules/cbt/http-errors";

/** Sekali sync menampung paling banyak sekian jawaban. */
const MAX_BATCH = 100;

/**
 * POST /api/v1/cbt/student/answers/sync
 *
 * Kirim antrean jawaban yang terkumpul saat aplikasi offline. Jawaban yang
 * lolos pemeriksaan tetap tersimpan meski ada entri lain yang ditolak -
 * satu entri rusak tidak boleh menjatuhkan seluruh antrean.
 */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const { student } = await requireStudent(req);
    const body = await readJson(req);
    const examId = requiredString(body, "examId");

    const answers = Array.isArray(body.answers) ? (body.answers as AnswerInput[]) : [];
    if (answers.length === 0) {
      throw badRequest("Field \"answers\" wajib diisi", "VALIDATION_ERROR");
    }
    if (answers.length > MAX_BATCH) {
      throw badRequest(`Maksimal ${MAX_BATCH} jawaban per sync`, "BATCH_TOO_LARGE");
    }

    const result = await syncAnswers(examId, student.id, answers);

    if (result.state === "NO_ATTEMPT") throw attemptNotFound();
    if (result.state === "ALREADY_SUBMITTED") throw alreadySubmitted();
    if (result.state === "LOCKED") throw attemptLocked(result.lockReason);
    if (result.state === "NO_VALID_ANSWERS") {
      throw badRequest("Tidak ada jawaban valid", "NO_VALID_ANSWERS");
    }

    return apiOk({
      synced: result.synced,
      failed: result.errors.length,
      errors: result.errors,
      serverTime: new Date().toISOString(),
    });
  });
}

export async function OPTIONS() {
  return preflight();
}
