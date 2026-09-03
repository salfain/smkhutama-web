import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/server/auth";
import { canReviewAttempt, getAttemptForReview } from "@/server/modules/cbt/review";
import { toAttemptReview } from "@/server/modules/cbt/dto";

export const dynamic = "force-dynamic";

/**
 * Endpoint versi lama - lembar jawaban satu attempt beserta kunci jawabannya.
 * Penggantinya: GET /api/v1/cbt/attempts/{attemptId}/answers.
 *
 * PERUBAHAN KEAMANAN: sebelumnya endpoint ini tidak memeriksa siapa pun,
 * sehingga siapa saja yang tahu `attemptId` bisa membaca kunci jawaban tanpa
 * login. Sekarang wajib terautentikasi - lewat cookie sesi (halaman web) atau
 * Bearer token (mobile) - dan siswa hanya boleh membuka attempt miliknya.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });

  const { attemptId } = await params;
  const attempt = await getAttemptForReview(attemptId);
  if (!attempt) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  if (!canReviewAttempt(actor, attempt)) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  return NextResponse.json(toAttemptReview(attempt));
}
