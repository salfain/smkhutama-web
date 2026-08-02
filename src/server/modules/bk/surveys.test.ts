/**
 * Rekap angket AKPD. Rata-rata tertinggi berarti kebutuhan paling mendesak,
 * dan lima teratasnya yang jadi dasar guru BK menyusun program layanan.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { summarizeSurvey } from "./surveys";

function soal(id: string, category: string | null = null) {
  return { id, text: `pertanyaan ${id}`, category };
}
function jawaban(pasangan: Record<string, number>) {
  return {
    answers: Object.entries(pasangan).map(([questionId, value]) => ({ questionId, value })),
  };
}

describe("summarizeSurvey", () => {
  test("rata-rata per pertanyaan dan jumlah penjawabnya", () => {
    const { perQuestion } = summarizeSurvey({
      questions: [soal("q1"), soal("q2")],
      responses: [jawaban({ q1: 4, q2: 1 }), jawaban({ q1: 2, q2: 3 })],
    });

    assert.deepEqual(
      perQuestion.map((q) => [q.questionId, q.average, q.answerCount]),
      [
        ["q1", 3, 2],
        ["q2", 2, 2],
      ]
    );
  });

  test("dibulatkan dua desimal", () => {
    const { perQuestion } = summarizeSurvey({
      questions: [soal("q1")],
      responses: [jawaban({ q1: 1 }), jawaban({ q1: 1 }), jawaban({ q1: 2 })],
    });
    assert.equal(perQuestion[0].average, 1.33);
  });

  test("pertanyaan yang tidak dijawab siapa pun → 0, bukan pembagian nol", () => {
    const { perQuestion } = summarizeSurvey({
      questions: [soal("q1"), soal("q2")],
      responses: [jawaban({ q1: 3 })],
    });
    assert.deepEqual(perQuestion[1], {
      questionId: "q2",
      text: "pertanyaan q2",
      category: null,
      average: 0,
      answerCount: 0,
    });
  });

  test("angket tanpa responden sama sekali", () => {
    const { perQuestion, priorities } = summarizeSurvey({
      questions: [soal("q1")],
      responses: [],
    });
    assert.equal(perQuestion[0].average, 0);
    assert.equal(priorities.length, 1);
  });

  test("prioritas diurutkan dari kebutuhan tertinggi", () => {
    const { priorities } = summarizeSurvey({
      questions: [soal("rendah"), soal("tinggi"), soal("sedang")],
      responses: [jawaban({ rendah: 1, tinggi: 4, sedang: 2 })],
    });
    assert.deepEqual(
      priorities.map((p) => p.questionId),
      ["tinggi", "sedang", "rendah"]
    );
  });

  test("prioritas dibatasi lima teratas", () => {
    const questions = Array.from({ length: 8 }, (_, i) => soal(`q${i}`));
    const nilai = Object.fromEntries(questions.map((q, i) => [q.id, i + 1]));
    const { perQuestion, priorities } = summarizeSurvey({
      questions,
      responses: [jawaban(nilai)],
    });

    assert.equal(perQuestion.length, 8);
    assert.equal(priorities.length, 5);
    assert.equal(priorities[0].questionId, "q7");
  });

  test("urutan perQuestion mengikuti urutan pertanyaan, bukan nilainya", () => {
    const { perQuestion } = summarizeSurvey({
      questions: [soal("a"), soal("b"), soal("c")],
      responses: [jawaban({ a: 1, b: 4, c: 2 })],
    });
    assert.deepEqual(
      perQuestion.map((q) => q.questionId),
      ["a", "b", "c"]
    );
  });
});
