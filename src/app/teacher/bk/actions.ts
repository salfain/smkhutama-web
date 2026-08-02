"use server";

/**
 * Server action rekap BK untuk wali kelas.
 * Query-nya dipinjam dari `@/server/modules/bk/service`.
 */

import { requireAuth } from "@/lib/session";
import { getHomeroomClasses, sumPoints } from "@/server/modules/bk/service";

export async function getHomeroomBk() {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return null;

  const classes = await getHomeroomClasses(user.teacher.id);

  return classes.map((c) => ({
    id: c.id,
    name: c.name,
    students: c.students.map((s) => ({
      id: s.id,
      name: s.user.name,
      nis: s.nis ?? "",
      violationPoints: sumPoints(s.violationRecords),
      achievementPoints: sumPoints(s.achievementRecords),
      cases: s.counselingCases.length,
    })),
  }));
}
