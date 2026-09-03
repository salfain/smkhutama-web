import type { NextRequest } from "next/server";
import { apiOk, handle, preflight } from "@/server/http";
import { requireTeacher } from "@/server/auth";
import { listTeacherExams } from "@/server/modules/cbt/teacher";
import { toTeacherExam } from "@/server/modules/cbt/dto";

/**
 * GET /api/v1/cbt/teacher/exams - ujian milik guru.
 *
 * Hanya baca. Pembuatan, aktivasi, dan penghapusan ujian beserta tokennya
 * dikelola admin lewat halaman web, jadi tidak ada padanan tulisnya di sini.
 */
export async function GET(req: NextRequest) {
  return handle(async () => {
    const { teacher } = await requireTeacher(req);
    const exams = await listTeacherExams(teacher.id);
    return apiOk(exams.map(toTeacherExam));
  });
}

export async function OPTIONS() {
  return preflight();
}
