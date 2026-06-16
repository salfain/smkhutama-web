"use server";

import { prisma } from "@/lib/prisma";

export async function getExamsForPrint() {
  return prisma.exam.findMany({
    orderBy: { startAt: "desc" },
    select: {
      id: true, title: true, examType: true, startAt: true,
      subject: { select: { code: true, name: true } },
      classes: { include: { class: { select: { name: true } } } },
    },
  });
}

export async function getExamPrintData(examId: string) {
  const [exam, school] = await Promise.all([
    prisma.exam.findUnique({
      where: { id: examId },
      include: {
        subject: { select: { name: true, code: true } },
        teacher: { include: { user: { select: { name: true } } } },
        academicYear: { select: { year: true, semester: true } },
        classes: { include: { class: { select: { id: true, name: true } } } },
        tokens: { where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.schoolProfile.findFirst(),
  ]);

  if (!exam) return null;

  const classIds = exam.classes.map((c) => c.class.id);
  const students = await prisma.student.findMany({
    where: classIds.length > 0 ? { classId: { in: classIds } } : {},
    orderBy: [{ class: { name: "asc" } }, { user: { name: "asc" } }],
    include: {
      user: { select: { name: true } },
      class: { select: { name: true } },
      attempts: { where: { examId }, take: 1, select: { status: true, startedAt: true, submittedAt: true } },
    },
  });

  return {
    exam: {
      id: exam.id,
      title: exam.title,
      examType: exam.examType,
      subject: exam.subject,
      teacherName: exam.teacher.user.name,
      durationMinutes: exam.durationMinutes,
      startAt: exam.startAt,
      endAt: exam.endAt,
      academicYear: exam.academicYear,
      classNames: exam.classes.map((c) => c.class.name),
      token: exam.tokens[0]?.token ?? null,
    },
    school: school ?? null,
    students: students.map((s, i) => ({
      no: i + 1,
      name: s.user.name,
      nis: s.nis,
      nisn: s.nisn,
      className: s.class?.name ?? "—",
      present: !!s.attempts[0]?.startedAt,
      status: s.attempts[0]?.status ?? "NOT_STARTED",
    })),
  };
}
