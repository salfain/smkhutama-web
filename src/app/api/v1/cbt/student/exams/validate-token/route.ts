import type { NextRequest } from "next/server";
import { apiOk, handle, preflight, readJson, requiredString } from "@/server/http";
import { requireStudent } from "@/server/auth";
import { checkExamAccess, checkExamToken, findExamWithClasses } from "@/server/modules/cbt/exam-session";
import { examAccessError, examTokenError } from "@/server/modules/cbt/http-errors";

/**
 * POST /api/v1/cbt/student/exams/validate-token
 *
 * Memeriksa token tanpa memulai ujian, supaya klien bisa memberi tahu siswa
 * lebih dulu kalau tokennya salah.
 */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const { student } = await requireStudent(req);
    const body = await readJson(req);
    const examId = requiredString(body, "examId");
    const now = new Date();

    const exam = await findExamWithClasses(examId);
    const accessCode = checkExamAccess(exam, student.classId, now);
    if (accessCode) throw examAccessError(accessCode);

    const tokenCode = await checkExamToken(examId, body.token, now);
    if (tokenCode) throw examTokenError(tokenCode);

    return apiOk({ valid: true });
  });
}

export async function OPTIONS() {
  return preflight();
}
