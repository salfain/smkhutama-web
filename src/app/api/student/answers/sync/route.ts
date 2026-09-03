import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { type AnswerInput, syncAnswers } from "@/server/modules/cbt/exam-session";

const MAX_BATCH = 100;

// Endpoint versi lama - antrean jawaban yang terkumpul saat aplikasi offline.
// Penggantinya: POST /api/v1/cbt/student/answers/sync.
export async function POST(req: NextRequest) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const examId = String(body.examId ?? "").trim();
  const answers = Array.isArray(body.answers) ? (body.answers as AnswerInput[]) : [];

  if (!examId) return NextResponse.json({ error: "examId wajib" }, { status: 400 });
  if (answers.length === 0) {
    return NextResponse.json({ error: "answers wajib diisi" }, { status: 400 });
  }
  if (answers.length > MAX_BATCH) {
    return NextResponse.json({ error: `Maksimal ${MAX_BATCH} jawaban per sync` }, { status: 400 });
  }

  const result = await syncAnswers(examId, student.id, answers);

  if (result.state === "NO_ATTEMPT") {
    return NextResponse.json({ error: "Attempt tidak ditemukan" }, { status: 404 });
  }
  if (result.state === "ALREADY_SUBMITTED") {
    return NextResponse.json({ error: "Ujian sudah disubmit" }, { status: 400 });
  }
  if (result.state === "LOCKED") {
    return NextResponse.json(
      { error: "Ujian terkunci", locked: true, lockReason: result.lockReason },
      { status: 423 }
    );
  }
  if (result.state === "NO_VALID_ANSWERS") {
    return NextResponse.json(
      { error: "Tidak ada jawaban valid", synced: 0, errors: result.errors },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    synced: result.synced,
    failed: result.errors.length,
    errors: result.errors,
    serverTime: new Date().toISOString(),
  });
}
