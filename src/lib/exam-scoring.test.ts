/**
 * Penilaian ujian — bagian paling berisiko di seluruh aplikasi: kalau salah,
 * nilai siswa salah dan tidak ada yang menyadarinya sampai rapor terbit.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { calculateFinalScoreAfterManual, calculateSubmissionScore } from "./exam-scoring";

type Opt = { id: string; isCorrect: boolean };

function mc(id: string, weight = 1) {
  return { id, questionType: "MULTIPLE_CHOICE" as const, scoreWeight: weight };
}
function essay(id: string, weight = 1) {
  return { id, questionType: "ESSAY" as const, scoreWeight: weight };
}
function answer(id: string, questionId: string, selectedOptionId: string | null, options: Opt[]) {
  return { id, questionId, selectedOptionId, question: { options } };
}

const BENAR: Opt[] = [
  { id: "a", isCorrect: true },
  { id: "b", isCorrect: false },
];

describe("calculateSubmissionScore", () => {
  test("3 dari 4 pilihan ganda benar → 75", () => {
    const questions = [mc("q1"), mc("q2"), mc("q3"), mc("q4")];
    const answers = [
      answer("a1", "q1", "a", BENAR),
      answer("a2", "q2", "a", BENAR),
      answer("a3", "q3", "a", BENAR),
      answer("a4", "q4", "b", BENAR),
    ];

    const { finalScore, updates } = calculateSubmissionScore({
      questions,
      answers,
      multipleChoicePercentage: 100,
      essayPercentage: 0,
    });

    assert.equal(finalScore, 75);
    assert.deepEqual(
      updates.map((u) => u.isCorrect),
      [true, true, true, false]
    );
    assert.deepEqual(
      updates.map((u) => u.score),
      [100, 100, 100, 0]
    );
  });

  test("bobot soal diperhitungkan, bukan sekadar jumlah soal", () => {
    // Soal berbobot 3 dijawab benar, soal berbobot 1 salah → 3/4 = 75.
    const { finalScore } = calculateSubmissionScore({
      questions: [mc("q1", 3), mc("q2", 1)],
      answers: [answer("a1", "q1", "a", BENAR), answer("a2", "q2", "b", BENAR)],
      multipleChoicePercentage: 100,
      essayPercentage: 0,
    });
    assert.equal(finalScore, 75);
  });

  test("soal yang tidak dijawab sama sekali tetap menambah pembagi", () => {
    // Hanya 1 dari 2 soal punya baris jawaban; yang tidak dijawab ikut dihitung.
    const { finalScore, updates } = calculateSubmissionScore({
      questions: [mc("q1"), mc("q2")],
      answers: [answer("a1", "q1", "a", BENAR)],
      multipleChoicePercentage: 100,
      essayPercentage: 0,
    });
    assert.equal(finalScore, 50);
    assert.equal(updates.length, 1);
  });

  test("jawaban tanpa opsi terpilih dinilai salah, bukan diabaikan", () => {
    const { finalScore, updates } = calculateSubmissionScore({
      questions: [mc("q1"), mc("q2")],
      answers: [answer("a1", "q1", "a", BENAR), answer("a2", "q2", null, BENAR)],
      multipleChoicePercentage: 100,
      essayPercentage: 0,
    });
    assert.equal(finalScore, 50);
    assert.deepEqual(updates[1], { id: "a2", isCorrect: false, score: 0 });
  });

  test("ada esai yang dijawab → nilai ditahan sampai guru menilai", () => {
    const { finalScore, updates } = calculateSubmissionScore({
      questions: [mc("q1"), essay("q2")],
      answers: [answer("a1", "q1", "a", BENAR), answer("a2", "q2", null, [])],
      multipleChoicePercentage: 70,
      essayPercentage: 30,
    });

    assert.equal(finalScore, null);
    // Baris jawaban esai dikosongkan nilainya, menunggu penilaian manual.
    assert.deepEqual(updates.at(-1), { id: "a2", isCorrect: null, score: null });
  });

  test("esai ada tapi dikosongkan siswa → nilai langsung keluar, terbatas bobot PG", () => {
    // Perilaku yang berlaku: siswa yang melewati esai maksimal dapat 70
    // pada ujian berbobot 70/30, tanpa menunggu penilaian guru.
    const { finalScore } = calculateSubmissionScore({
      questions: [mc("q1"), essay("q2")],
      answers: [answer("a1", "q1", "a", BENAR)],
      multipleChoicePercentage: 70,
      essayPercentage: 30,
    });
    assert.equal(finalScore, 70);
  });

  test("bobot dinormalkan bila jumlahnya bukan 100", () => {
    // 7 : 3 diperlakukan sama dengan 70 : 30.
    const { finalScore } = calculateSubmissionScore({
      questions: [mc("q1"), essay("q2")],
      answers: [answer("a1", "q1", "a", BENAR)],
      multipleChoicePercentage: 7,
      essayPercentage: 3,
    });
    assert.equal(finalScore, 70);
  });

  test("ujian tanpa soal sama sekali → 0, bukan pembagian nol", () => {
    const { finalScore } = calculateSubmissionScore({
      questions: [],
      answers: [],
      multipleChoicePercentage: 100,
      essayPercentage: 0,
    });
    assert.equal(finalScore, 0);
  });
});

describe("calculateFinalScoreAfterManual", () => {
  const questions = [mc("q1"), mc("q2"), essay("q3")];

  function graded(essayScore: number | null) {
    return [
      { ...answer("a1", "q1", "a", BENAR), score: 100 },
      { ...answer("a2", "q2", "b", BENAR), score: 0 },
      { ...answer("a3", "q3", null, []), score: essayScore },
    ];
  }

  test("PG 50 bobot 70% + esai 80 bobot 30% → 59", () => {
    const score = calculateFinalScoreAfterManual({
      questions,
      answers: graded(80),
      multipleChoicePercentage: 70,
      essayPercentage: 30,
    });
    assert.equal(score, 59);
  });

  test("masih ada esai yang belum dinilai → null, bukan 0", () => {
    const score = calculateFinalScoreAfterManual({
      questions,
      answers: graded(null),
      multipleChoicePercentage: 70,
      essayPercentage: 30,
    });
    assert.equal(score, null);
  });

  test("esai dinilai 0 berbeda dengan esai belum dinilai", () => {
    const score = calculateFinalScoreAfterManual({
      questions,
      answers: graded(0),
      multipleChoicePercentage: 70,
      essayPercentage: 30,
    });
    assert.equal(score, 35);
  });
});
