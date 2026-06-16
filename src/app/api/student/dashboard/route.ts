import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const r = await requireApiAuth(req, "STUDENT");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const student = r.user.student;
  if (!student) return NextResponse.json({ error: "No student profile" }, { status: 400 });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const classId = student.classId;

  const [todayExams, upcomingExams, history] = await Promise.all([
    prisma.exam.findMany({
      where: { status: "ACTIVE", startAt: { lte: todayEnd }, endAt: { gte: now },
        ...(classId ? { classes: { some: { classId } } } : {}) },
      orderBy: { startAt: "asc" },
      include: { subject: { select: { code: true, name: true } }, _count: { select: { questions: true } } },
    }),
    prisma.exam.findMany({
      where: { status: { in: ["ACTIVE", "DRAFT"] }, startAt: { gt: todayEnd },
        ...(classId ? { classes: { some: { classId } } } : {}) },
      orderBy: { startAt: "asc" }, take: 5,
      include: { subject: { select: { code: true, name: true } } },
    }),
    prisma.studentExamAttempt.findMany({
      where: { studentId: student.id, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
      orderBy: { submittedAt: "desc" }, take: 5,
      include: { exam: { include: { subject: { select: { code: true } } } } },
    }),
  ]);

  return NextResponse.json({ todayExams, upcomingExams, history });
}
