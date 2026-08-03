import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { canPrintExam, getExamForPrint, getSchoolProfile } from "@/server/modules/cbt/exam-print";
import { toExamPrint } from "@/server/modules/cbt/dto";

/**
 * GET /api/admin/exams/[id]/print-questions — endpoint versi lama.
 * Semua soal dalam paket ujian beserta opsi jawaban, untuk halaman cetak/PDF.
 * Penggantinya: GET /api/v1/cbt/admin/exams/{id}/print-questions.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth();
  if (!user || (user.role !== "ADMIN_CBT" && user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const { id: examId } = await params;
  const exam = await getExamForPrint(examId);
  if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });

  if (!canPrintExam(user, exam)) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const school = await getSchoolProfile();
  return NextResponse.json(toExamPrint(exam, school));
}
