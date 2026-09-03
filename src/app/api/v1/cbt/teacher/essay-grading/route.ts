import type { NextRequest } from "next/server";
import { apiOk, handle, preflight } from "@/server/http";
import { requireTeacher } from "@/server/auth";
import { listEssayAnswers } from "@/server/modules/cbt/teacher";
import { toEssayAnswer } from "@/server/modules/cbt/dto";

/**
 * GET /api/v1/cbt/teacher/essay-grading - jawaban esai pada ujian yang sudah
 * dikumpulkan, termasuk yang sudah dinilai (nilainya ikut terkirim).
 */
export async function GET(req: NextRequest) {
  return handle(async () => {
    const { teacher } = await requireTeacher(req);
    const answers = await listEssayAnswers(teacher.id, "SAVED_ASC");
    return apiOk(answers.map(toEssayAnswer));
  });
}

export async function OPTIONS() {
  return preflight();
}
