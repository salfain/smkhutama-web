import type { NextRequest } from "next/server";
import { ApiError, apiOk, badRequest, handle, notFound, preflight, readJson } from "@/server/http";
import { requireStudent } from "@/server/auth";
import {
  getSurveyForStudent,
  hasResponded,
  submitSurveyResponse,
} from "@/server/modules/bk/surveys";
import { toStudentSurveyDetail } from "@/server/modules/bk/dto";

const MIN_VALUE = 1;
const MAX_VALUE = 4;

/** GET /api/v1/bk/student/surveys/{id} — pertanyaan angket untuk diisi. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { student } = await requireStudent(req);
    const { id } = await ctx.params;

    const survey = await getSurveyForStudent(id, student.id);
    if (!survey) throw notFound("Angket tidak ditemukan atau sudah tidak aktif");

    return apiOk(toStudentSurveyDetail(survey));
  });
}

/** POST /api/v1/bk/student/surveys/{id} — kirim jawaban angket. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { student } = await requireStudent(req);
    const { id } = await ctx.params;

    const survey = await getSurveyForStudent(id, student.id);
    if (!survey) throw notFound("Angket tidak ditemukan atau sudah tidak aktif");

    if (await hasResponded(id, student.id)) {
      throw new ApiError(409, "ALREADY_ANSWERED", "Anda sudah mengisi angket ini");
    }

    const body = await readJson(req);
    const answers = body.answers;
    if (!Array.isArray(answers) || answers.length === 0) {
      throw badRequest("Jawaban wajib diisi", "VALIDATION_ERROR");
    }

    const questionIds = new Set(survey.questions.map((q) => q.id));
    const parsed = answers.map((answer) => {
      const questionId = typeof answer?.questionId === "string" ? answer.questionId : "";
      if (!questionIds.has(questionId)) {
        throw badRequest("Ada questionId yang bukan milik angket ini", "VALIDATION_ERROR");
      }
      const value = answer?.value;
      if (typeof value !== "number" || value < MIN_VALUE || value > MAX_VALUE) {
        throw badRequest(`Nilai jawaban harus ${MIN_VALUE}–${MAX_VALUE}`, "VALIDATION_ERROR");
      }
      return { questionId, value };
    });

    const response = await submitSurveyResponse(id, student.id, parsed);
    return apiOk({ id: response.id, answerCount: response.answers.length }, 201);
  });
}

export async function OPTIONS() {
  return preflight();
}
