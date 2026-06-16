"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    totalSubjects,
    totalQuestions,
    activeExams,
    inProgressAttempts,
    submittedAttempts,
    schoolProfile,
    activeYear,
    recentExams,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.class.count(),
    prisma.subject.count(),
    prisma.question.count({ where: { isActive: true } }),
    prisma.exam.count({ where: { status: "ACTIVE" } }),
    prisma.studentExamAttempt.count({ where: { status: "IN_PROGRESS" } }),
    prisma.studentExamAttempt.count({ where: { status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } } }),
    prisma.schoolProfile.findFirst(),
    prisma.academicYear.findFirst({ where: { isActive: true } }),
    prisma.exam.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        subject: { select: { name: true } },
        teacher: { include: { user: { select: { name: true } } } },
        _count: { select: { attempts: true } },
      },
    }),
  ]);

  return {
    totalStudents,
    totalTeachers,
    totalClasses,
    totalSubjects,
    totalQuestions,
    activeExams,
    inProgressAttempts,
    submittedAttempts,
    schoolProfile,
    activeYear,
    recentExams,
  };
}

export async function getChartData() {
  // Ujian per status per 7 hari terakhir
  const exams = await prisma.exam.findMany({
    where: { startAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    include: {
      subject: { select: { name: true } },
      _count: { select: { attempts: true } },
    },
    orderBy: { startAt: "asc" },
  });

  // Rata-rata nilai per mapel
  const subjectScores = await prisma.studentExamAttempt.groupBy({
    by: ["examId"],
    where: { score: { not: null }, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
    _avg: { score: true },
    _count: true,
  });

  // Ambil exam info untuk subjectScores
  const examIds = subjectScores.map((s) => s.examId);
  const examInfos = await prisma.exam.findMany({
    where: { id: { in: examIds } },
    select: { id: true, subject: { select: { name: true } } },
  });

  const avgBySubject: Record<string, { total: number; count: number }> = {};
  for (const s of subjectScores) {
    const examInfo = examInfos.find((e) => e.id === s.examId);
    const subjectName = examInfo?.subject.name ?? "Lainnya";
    if (!avgBySubject[subjectName]) avgBySubject[subjectName] = { total: 0, count: 0 };
    avgBySubject[subjectName].total += (s._avg.score ?? 0) * s._count;
    avgBySubject[subjectName].count += s._count;
  }

  const scoreChartData = Object.entries(avgBySubject).map(([mapel, v]) => ({
    mapel: mapel.length > 8 ? mapel.substring(0, 8) + ".." : mapel,
    nilai: Math.round(v.total / v.count),
  }));

  return { exams, scoreChartData };
}
