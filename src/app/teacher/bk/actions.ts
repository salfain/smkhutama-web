"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function getHomeroomBk() {
  const user = await requireAuth("TEACHER");
  if (!user.teacher) return null;

  const classes = await prisma.class.findMany({
    where: { homeroomTeacherId: user.teacher.id },
    include: {
      students: {
        include: {
          user: { select: { name: true } },
          violationRecords: { select: { points: true } },
          achievementRecords: { select: { points: true } },
          counselingCases: { select: { id: true } },
        },
        orderBy: { user: { name: "asc" } },
      },
    },
    orderBy: { name: "asc" },
  });

  return classes.map((c) => ({
    id: c.id, name: c.name,
    students: c.students.map((s) => ({
      id: s.id, name: s.user.name, nis: s.nis ?? "",
      violationPoints: s.violationRecords.reduce((a, v) => a + v.points, 0),
      achievementPoints: s.achievementRecords.reduce((a, v) => a + v.points, 0),
      cases: s.counselingCases.length,
    })),
  }));
}
