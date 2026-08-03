import type { NextRequest } from "next/server";
import { apiOk, handle, preflight } from "@/server/http";
import { requireStudent } from "@/server/auth";
import { listSurveysForStudent } from "@/server/modules/bk/surveys";
import { toStudentSurvey } from "@/server/modules/bk/dto";

/** GET /api/v1/bk/student/surveys — angket aktif yang bisa diisi siswa. */
export async function GET(req: NextRequest) {
  return handle(async () => {
    const { student } = await requireStudent(req);
    const surveys = await listSurveysForStudent(student.id);
    return apiOk(surveys.map(toStudentSurvey));
  });
}

export async function OPTIONS() {
  return preflight();
}
