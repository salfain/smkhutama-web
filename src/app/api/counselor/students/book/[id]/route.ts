import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { getStudentBook } from "@/server/modules/bk/service";
import { toStudentBook } from "@/server/modules/bk/dto";

// Endpoint versi lama. Penggantinya: /api/v1/bk/counselor/students/book/{id}.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireApiAuth(req, "COUNSELOR");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const { id } = await params;
  const student = await getStudentBook(id);
  if (!student) return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });

  return NextResponse.json(toStudentBook(student));
}
