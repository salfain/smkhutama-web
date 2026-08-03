/**
 * Modul CBT — pembahasan lembar jawaban satu attempt.
 *
 * Dipakai dialog tinjau jawaban di halaman hasil siswa maupun guru. Isinya
 * memuat kunci jawaban, jadi pemanggil wajib memastikan penanya berhak
 * melihatnya — lihat `canReviewAttempt`.
 */

import { prisma } from "@/lib/prisma";

export async function getAttemptForReview(attemptId: string) {
  return prisma.studentExamAttempt.findUnique({
    where: { id: attemptId },
    include: {
      student: {
        include: {
          user: { select: { name: true } },
          class: { select: { name: true } },
        },
      },
      exam: {
        select: {
          title: true,
          showResult: true,
          passingScore: true,
          subject: { select: { code: true, name: true } },
          questions: {
            orderBy: { orderNumber: "asc" },
            include: { question: { include: { options: { orderBy: { orderNumber: "asc" } } } } },
          },
        },
      },
      answers: {
        include: {
          question: { select: { id: true } },
          selectedOption: { select: { id: true, optionLabel: true, optionText: true } },
        },
      },
    },
  });
}

/**
 * Guru, admin, dan guru BK boleh meninjau attempt siapa pun; siswa hanya
 * miliknya sendiri.
 */
export function canReviewAttempt(
  actor: { role: string; student?: { id: string } | null },
  attempt: { studentId: string }
) {
  if (actor.role === "TEACHER" || actor.role === "ADMIN" || actor.role === "COUNSELOR") return true;
  if (actor.role === "STUDENT") return actor.student?.id === attempt.studentId;
  return false;
}
