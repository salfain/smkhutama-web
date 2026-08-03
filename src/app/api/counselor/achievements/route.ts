import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { listAchievements, saveAchievement } from "@/server/modules/bk/service";
import { toAchievement } from "@/server/modules/bk/dto";

// Endpoint versi lama. Penggantinya: /api/v1/bk/counselor/achievements.
export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const rows = await listAchievements({ take: 50 });
  return NextResponse.json(rows.map(toAchievement));
}

export async function POST(req: NextRequest) {
  const r = await requireApiAuth(req, "KESISWAAN");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const body = await req.json().catch(() => ({}));
  const studentId = String(body.studentId ?? "").trim();
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const points = parseInt(String(body.points ?? "0"), 10) || 0;
  const level = String(body.level ?? "").trim();

  if (!studentId || !title) {
    return NextResponse.json({ error: "Siswa dan judul wajib diisi" }, { status: 400 });
  }

  await saveAchievement({
    studentId,
    recordedById: r.user.id,
    title,
    description,
    points,
    level,
  });

  return NextResponse.json({ success: true });
}
