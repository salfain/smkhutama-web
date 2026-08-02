"use server";

/**
 * Server action beranda guru.
 * Query-nya dipinjam dari `@/server/modules/cbt/teacher`.
 */

import { getRecentExams, getScoreByClass, getTeacherCounts } from "@/server/modules/cbt/teacher";

export async function getTeacherDashboard(teacherId: string) {
  const [counts, scoreByClass, recentExams] = await Promise.all([
    getTeacherCounts(teacherId),
    getScoreByClass(teacherId),
    getRecentExams(teacherId),
  ]);

  return { ...counts, scoreByClass, recentExams };
}
