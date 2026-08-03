import type { NextRequest } from "next/server";
import { apiOk, handle, preflight } from "@/server/http";
import { requireStudent } from "@/server/auth";
import { listExams } from "@/server/modules/cbt/student";
import { toExamListItem } from "@/server/modules/cbt/dto";

/** GET /api/v1/cbt/student/exams — ujian untuk kelas siswa. */
export async function GET(req: NextRequest) {
  return handle(async () => {
    const { student } = await requireStudent(req);
    const exams = await listExams(student);
    return apiOk(exams.map(toExamListItem));
  });
}

export async function OPTIONS() {
  return preflight();
}
