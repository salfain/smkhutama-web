type QuestionType =
  | "MULTIPLE_CHOICE"
  | "MULTIPLE_CHOICE_COMPLEX"
  | "TRUE_FALSE"
  | "MATCHING"
  | "SHORT_ANSWER"
  | "ESSAY";

type ScoringQuestion = {
  id: string;
  questionType: QuestionType;
  scoreWeight?: number | null;
};

type ScoringAnswer = {
  id: string;
  questionId: string;
  selectedOptionId?: string | null;
  score?: number | null;
  question: {
    options?: { id: string; isCorrect: boolean }[];
  };
};

function isAutoScored(type: QuestionType) {
  return type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE" || type === "MULTIPLE_CHOICE_COMPLEX";
}

function isManualScored(type: QuestionType) {
  return type === "ESSAY" || type === "SHORT_ANSWER" || type === "MATCHING";
}

function normalizeWeights(mcPercentage: number, essayPercentage: number, hasManual: boolean) {
  if (!hasManual) return { mc: 100, essay: 0 };
  const total = mcPercentage + essayPercentage;
  if (total <= 0) return { mc: 100, essay: 0 };
  return {
    mc: (mcPercentage / total) * 100,
    essay: (essayPercentage / total) * 100,
  };
}

export function calculateSubmissionScore(input: {
  questions: ScoringQuestion[];
  answers: ScoringAnswer[];
  multipleChoicePercentage: number;
  essayPercentage: number;
}) {
  const answeredMap = new Map(input.answers.map((answer) => [answer.questionId, answer]));
  const updates: { id: string; isCorrect: boolean | null; score: number | null }[] = [];

  let mcTotalWeight = 0;
  let mcEarnedWeight = 0;
  let hasAnsweredManual = false;
  let hasManualQuestions = false;

  for (const question of input.questions) {
    const weight = question.scoreWeight ?? 1;
    const answer = answeredMap.get(question.id);

    if (isManualScored(question.questionType)) {
      hasManualQuestions = true;
      if (answer?.id) {
        hasAnsweredManual = true;
        updates.push({ id: answer.id, isCorrect: null, score: null });
      }
      continue;
    }

    if (isAutoScored(question.questionType)) {
      mcTotalWeight += weight;
      if (!answer?.selectedOptionId) {
        if (answer?.id) updates.push({ id: answer.id, isCorrect: false, score: 0 });
        continue;
      }

      const correctOptions = answer.question.options?.filter((option) => option.isCorrect) ?? [];
      const isCorrect = correctOptions.some((option) => option.id === answer.selectedOptionId);
      updates.push({ id: answer.id, isCorrect, score: isCorrect ? 100 : 0 });
      if (isCorrect) mcEarnedWeight += weight;
    }
  }

  const mcScore = mcTotalWeight > 0 ? (mcEarnedWeight / mcTotalWeight) * 100 : 0;
  const weights = normalizeWeights(input.multipleChoicePercentage, input.essayPercentage, hasManualQuestions);
  const finalScore = hasAnsweredManual ? null : Math.round((mcScore * weights.mc) / 100);

  return { updates, finalScore };
}

export function calculateFinalScoreAfterManual(input: {
  questions: ScoringQuestion[];
  answers: (ScoringAnswer & { score: number | null })[];
  multipleChoicePercentage: number;
  essayPercentage: number;
}) {
  const answerMap = new Map(input.answers.map((answer) => [answer.questionId, answer]));

  let mcTotalWeight = 0;
  let mcScoreWeight = 0;
  let manualTotalWeight = 0;
  let manualScoreWeight = 0;
  let hasManualQuestions = false;

  for (const question of input.questions) {
    const weight = question.scoreWeight ?? 1;
    const answer = answerMap.get(question.id);

    if (isAutoScored(question.questionType)) {
      mcTotalWeight += weight;
      mcScoreWeight += ((answer?.score ?? 0) * weight);
      continue;
    }

    if (isManualScored(question.questionType)) {
      hasManualQuestions = true;
      manualTotalWeight += weight;
      if (answer?.score === null || answer?.score === undefined) return null;
      manualScoreWeight += answer.score * weight;
    }
  }

  const mcScore = mcTotalWeight > 0 ? mcScoreWeight / mcTotalWeight : 0;
  const manualScore = manualTotalWeight > 0 ? manualScoreWeight / manualTotalWeight : 0;
  const weights = normalizeWeights(input.multipleChoicePercentage, input.essayPercentage, hasManualQuestions);

  return Math.round(((mcScore * weights.mc) + (manualScore * weights.essay)) / 100);
}
