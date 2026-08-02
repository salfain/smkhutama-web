/**
 * Modul BK — angket / asesmen kebutuhan siswa (AKPD).
 *
 * Menyatukan query angket yang sebelumnya ditulis terpisah di route API dan
 * di server action halaman guru BK maupun halaman siswa.
 */

import { prisma } from "@/lib/prisma";

// ─── Sisi guru BK ───────────────────────────────────────────────────────────

export async function listSurveys() {
  return prisma.survey.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true, responses: true } } },
  });
}

export async function getSurvey(id: string) {
  return prisma.survey.findUnique({
    where: { id },
    include: { questions: { orderBy: { orderNumber: "asc" } } },
  });
}

export type SaveSurveyInput = {
  id?: string | null;
  title: string;
  description?: string | null;
  isActive: boolean;
};

export async function saveSurvey(input: SaveSurveyInput) {
  const data = {
    title: input.title,
    description: input.description || null,
    isActive: input.isActive,
  };
  if (input.id) return prisma.survey.update({ where: { id: input.id }, data });
  return prisma.survey.create({ data });
}

export async function deleteSurvey(id: string) {
  const result = await prisma.survey.deleteMany({ where: { id } });
  return result.count > 0;
}

/**
 * Nomor urut berikutnya untuk pertanyaan baru.
 *
 * Diturunkan dari `orderNumber` terbesar yang ada, bukan dari jumlah
 * pertanyaan: kalau ada pertanyaan yang dihapus, jumlahnya menyusut dan nomor
 * urut baru akan bentrok dengan yang sudah dipakai.
 */
async function nextOrderNumber(surveyId: string) {
  const last = await prisma.surveyQuestion.findFirst({
    where: { surveyId },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });
  return (last?.orderNumber ?? 0) + 1;
}

export type SaveQuestionInput = {
  id?: string | null;
  surveyId: string;
  text: string;
  category?: string | null;
};

export async function saveQuestion(input: SaveQuestionInput) {
  if (input.id) {
    return prisma.surveyQuestion.update({
      where: { id: input.id },
      data: { text: input.text, category: input.category || null },
    });
  }

  return prisma.surveyQuestion.create({
    data: {
      surveyId: input.surveyId,
      text: input.text,
      category: input.category || null,
      orderNumber: await nextOrderNumber(input.surveyId),
    },
  });
}

export async function deleteQuestion(id: string) {
  const result = await prisma.surveyQuestion.deleteMany({ where: { id } });
  return result.count > 0;
}

// ─── Rekap hasil ────────────────────────────────────────────────────────────

/**
 * Angket beserta jawabannya saja — cukup untuk menghitung rekap, tanpa ikut
 * menarik identitas setiap responden.
 */
export async function getSurveyAnswers(id: string) {
  return prisma.survey.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { orderNumber: "asc" } },
      responses: { include: { answers: true } },
    },
  });
}

/** Sama seperti `getSurveyAnswers`, ditambah identitas responden. */
export async function getSurveyWithResponses(id: string) {
  return prisma.survey.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { orderNumber: "asc" } },
      responses: {
        include: {
          student: {
            include: { user: { select: { name: true } }, class: { select: { name: true } } },
          },
          answers: true,
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
}

export type QuestionSummary = {
  questionId: string;
  text: string;
  category: string | null;
  /** Rata-rata nilai jawaban pada skala 1–4, dibulatkan 2 desimal. */
  average: number;
  answerCount: number;
};

type SurveyForSummary = {
  questions: { id: string; text: string; category: string | null }[];
  responses: { answers: { questionId: string; value: number }[] }[];
};

/**
 * Rata-rata nilai per pertanyaan plus lima kebutuhan teratas.
 * Rata-rata tertinggi berarti kebutuhan paling mendesak.
 */
export function summarizeSurvey(survey: SurveyForSummary) {
  const perQuestion: QuestionSummary[] = survey.questions.map((question) => {
    let total = 0;
    let answerCount = 0;

    for (const response of survey.responses) {
      const answer = response.answers.find((a) => a.questionId === question.id);
      if (answer) {
        total += answer.value;
        answerCount += 1;
      }
    }

    const average = answerCount > 0 ? total / answerCount : 0;
    return {
      questionId: question.id,
      text: question.text,
      category: question.category,
      average: Math.round(average * 100) / 100,
      answerCount,
    };
  });

  const priorities = [...perQuestion].sort((a, b) => b.average - a.average).slice(0, 5);

  return { perQuestion, priorities };
}

// ─── Sisi siswa ─────────────────────────────────────────────────────────────

/** Angket aktif yang punya minimal satu pertanyaan, plus tanda sudah diisi. */
export async function listSurveysForStudent(studentId: string) {
  return prisma.survey.findMany({
    where: { isActive: true, questions: { some: {} } },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { questions: true } },
      responses: { where: { studentId }, select: { id: true } },
    },
  });
}

/** Angket untuk diisi siswa; null bila tidak ada atau sedang nonaktif. */
export async function getSurveyForStudent(id: string, studentId: string) {
  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { orderNumber: "asc" } },
      responses: { where: { studentId }, select: { id: true } },
    },
  });
  if (!survey || !survey.isActive) return null;
  return survey;
}

export async function hasResponded(surveyId: string, studentId: string) {
  const existing = await prisma.surveyResponse.findUnique({
    where: { surveyId_studentId: { surveyId, studentId } },
    select: { id: true },
  });
  return Boolean(existing);
}

export type SurveyAnswerInput = { questionId: string; value: number };

/**
 * Simpan jawaban angket satu siswa. Pemanggil bertanggung jawab memvalidasi
 * rentang nilai — API menolak nilai di luar 1–4, sedangkan form web
 * membiarkan pertanyaan yang dilewati tersimpan sebagai 0.
 */
export async function submitSurveyResponse(
  surveyId: string,
  studentId: string,
  answers: SurveyAnswerInput[]
) {
  return prisma.surveyResponse.create({
    data: {
      surveyId,
      studentId,
      answers: { create: answers.map((a) => ({ questionId: a.questionId, value: a.value })) },
    },
    include: { answers: true },
  });
}

/** Daftar id pertanyaan sebuah angket, urut nomor. */
export async function listQuestionIds(surveyId: string) {
  return prisma.surveyQuestion.findMany({
    where: { surveyId },
    orderBy: { orderNumber: "asc" },
    select: { id: true },
  });
}
