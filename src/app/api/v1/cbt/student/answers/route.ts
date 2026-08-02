import type { NextRequest } from "next/server";
import {
  apiOk,
  boolField,
  handle,
  optionalString,
  preflight,
  readJson,
  requiredString,
} from "@/server/http";
import { requireStudent } from "@/server/auth";
import { saveAnswer } from "@/server/modules/cbt/exam-session";
import { alreadySubmitted, attemptNotFound } from "@/server/modules/cbt/http-errors";

/** POST /api/v1/cbt/student/answers — simpan satu jawaban. */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const { student } = await requireStudent(req);
    const body = await readJson(req);

    const result = await saveAnswer(requiredString(body, "examId"), student.id, {
      questionId: requiredString(body, "questionId"),
      selectedOptionId: optionalString(body, "selectedOptionId"),
      answerText: typeof body.answerText === "string" ? body.answerText : null,
      isDoubtful: boolField(body, "isDoubtful"),
    });

    if (result === "NO_ATTEMPT") throw attemptNotFound();
    if (result === "ALREADY_SUBMITTED") throw alreadySubmitted();

    return apiOk({ saved: true });
  });
}

export async function OPTIONS() {
  return preflight();
}
