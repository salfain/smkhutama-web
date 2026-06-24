import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const result = await requireApiAuth(req);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }
  const u = result.user;
  return NextResponse.json({
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    role: u.role,
    student: u.student ? {
      id: u.student.id,
      nis: u.student.nis,
      nisn: u.student.nisn,
      gender: u.student.gender,
      class: u.student.class,
      major: u.student.major,
    } : null,
    teacher: u.teacher ? {
      id: u.teacher.id,
      nip: u.teacher.nip,
      subject: u.teacher.subject,
    } : null,
    counselor: u.counselor ? {
      id: u.counselor.id,
      nip: u.counselor.nip,
      phone: u.counselor.phone,
    } : null,
  });
}
