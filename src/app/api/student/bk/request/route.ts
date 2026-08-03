import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { createRequest } from "@/server/modules/bk/service";

// Endpoint versi lama. Penggantinya: POST /api/v1/bk/student/requests.
export async function POST(req: NextRequest) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student profile" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const topic = String(body.topic ?? "").trim();
  const description = String(body.description ?? "").trim();
  const urgency = String(body.urgency ?? "SEDANG").trim();
  const preferredDate = String(body.preferredDate ?? "").trim();

  if (!topic) return NextResponse.json({ error: "Topik wajib diisi" }, { status: 400 });

  await createRequest({
    studentId: student.id,
    topic,
    description,
    urgency,
    preferredDate,
  });

  return NextResponse.json({ success: true });
}
