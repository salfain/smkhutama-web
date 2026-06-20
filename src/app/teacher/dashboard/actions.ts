"use server";

import { prisma } from "@/lib/prisma";

export async function getTeacherDashboard(teacherId: string) {
  const [
    totalQuestions,
    totalExams,
    activeExams,
    closedExams,
    totalParticipants,
    pendingEssays,
    avgScoreData,
    recentExams,
  ] = await Promise.all([
    prisma.questionSet.count({ where: { ownerTeacherId: teacherId } }),
    prisma.exam.count({ where: { teacherId } }),
    prisma.exam.count({ where: { teacherId, status: "ACTIVE" } }),
    prisma.exam.count({ where: { teacherId, status: "CLOSED" } }),
    prisma.studentExamAttempt.count({ where: { exam: { teacherId } } }),
    prisma.studentAnswer.count({
      where: {
        question: { teacherId, questionType: "ESSAY" },
        score: null,
        attempt: { status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
      },
    }),
    prisma.studentExamAttempt.findMany({
      where: { exam: { teacherId }, score: { not: null } },
      include: {
        exam: { include: { subject: { select: { code: true } } } },
        student: { include: { class: { select: { name: true } } } },
      },
    }),
    prisma.exam.findMany({
      where: { teacherId },
      orderBy: { startAt: "desc" },
      take: 5,
      include: {
        subject: { select: { code: true } },
        _count: { select: { attempts: true } },
      },
    }),
  ]);

  // Group avg score by class
  const byClass: Record<string, { total: number; count: number }> = {};
  for (const a of avgScoreData) {
    const cls = a.student.class?.name ?? "—";
    if (!byClass[cls]) byClass[cls] = { total: 0, count: 0 };
    byClass[cls].total += a.score ?? 0;
    byClass[cls].count++;
  }
  const scoreByClass = Object.entries(byClass).map(([kelas, v]) => ({
    kelas,
    rata: Math.round(v.total / v.count),
  }));

  return {
    totalQuestions, totalExams, activeExams, closedExams,
    totalParticipants, pendingEssays,
    scoreByClass, recentExams,
  };
}
