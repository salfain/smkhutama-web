/**
 * Modul CBT — data cetak naskah soal.
 *
 * Berisi kunci jawaban, jadi pemanggil wajib memastikan yang meminta adalah
 * admin atau guru pemilik ujian — lihat `canPrintExam`.
 */

import { prisma } from "@/lib/prisma";

export async function getExamForPrint(examId: string) {
  return prisma.exam.findUnique({
    where: { id: examId },
    include: {
      subject: { select: { name: true, code: true } },
      teacher: { include: { user: { select: { name: true } } } },
      academicYear: { select: { year: true, semester: true } },
      classes: { include: { class: { select: { name: true } } } },
      questions: {
        orderBy: { orderNumber: "asc" },
        include: {
          question: {
            include: {
              options: {
                orderBy: { orderNumber: "asc" },
                select: { id: true, optionLabel: true, optionText: true, isCorrect: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function getSchoolProfile() {
  return prisma.schoolProfile.findFirst();
}

/** Admin boleh mencetak ujian mana pun; guru hanya ujian miliknya. */
export function canPrintExam(
  actor: { role: string; teacher?: { id: string } | null },
  exam: { teacherId: string }
) {
  if (actor.role === "ADMIN") return true;
  if (actor.role === "TEACHER") return actor.teacher?.id === exam.teacherId;
  return false;
}
