import type { NextRequest } from "next/server";
import { apiOk, handle, preflight } from "@/server/http";
import { requireTeacher } from "@/server/auth";
import { listTeacherQuestions } from "@/server/modules/cbt/teacher";

/**
 * GET /api/v1/cbt/teacher/questions - bank soal milik guru beserta pilihannya.
 *
 * Berisi kunci jawaban (`isCorrect` pada setiap pilihan), jadi hanya untuk
 * guru pemilik soal.
 */
export async function GET(req: NextRequest) {
  return handle(async () => {
    const { teacher } = await requireTeacher(req);
    return apiOk(await listTeacherQuestions(teacher.id));
  });
}

export async function OPTIONS() {
  return preflight();
}
