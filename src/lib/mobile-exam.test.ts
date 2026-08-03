/**
 * Batas waktu attempt dan pengacakan soal.
 *
 * Pengacakan harus **stabil per attempt**: siswa yang aplikasinya tertutup di
 * tengah ujian dan membuka lagi wajib melihat urutan yang sama persis,
 * kalau tidak jawaban yang sudah tersimpan akan tampak berpindah soal.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildMobileExamPayload, getAttemptExpiresAt } from "./mobile-exam";

/**
 * Id soal di basis data berupa UUID (`@default(uuid())`), dan itu penting:
 * pengacakan mengurutkan berdasarkan hash `attemptId:questionId`. Kalau id
 * soal berurutan dan berawalan sama (q1, q2, …), hash-nya ikut berurutan dan
 * "pengacakan" berubah jadi urutan asli. Karena itu uji ini memakai id
 * berbentuk UUID, sama seperti produksi.
 */
const ID = [
  "3f1c9a2e-5b7d-4e81-9c3a-1d2e4f5a6b70",
  "8a2d1b4c-6e3f-4a91-b5d7-2c8e9f0a1b23",
  "c5e7f9a1-2b3c-4d5e-8f01-3a4b5c6d7e89",
  "d1a2b3c4-5d6e-4f70-9a8b-7c6d5e4f3a21",
  "e9f8a7b6-c5d4-4e32-b1a0-9f8e7d6c5b4a",
];

describe("getAttemptExpiresAt", () => {
  const berakhir = new Date("2026-08-02T12:00:00Z");

  test("durasi habis lebih dulu → pakai batas durasi", () => {
    const mulai = new Date("2026-08-02T10:00:00Z");
    const hasil = getAttemptExpiresAt({ durationMinutes: 60, endAt: berakhir }, mulai);
    assert.equal(hasil.toISOString(), "2026-08-02T11:00:00.000Z");
  });

  test("jam ujian berakhir lebih dulu → pakai batas ujian", () => {
    const mulai = new Date("2026-08-02T11:30:00Z");
    const hasil = getAttemptExpiresAt({ durationMinutes: 60, endAt: berakhir }, mulai);
    assert.equal(hasil.toISOString(), berakhir.toISOString());
  });

  test("attempt belum punya waktu mulai → dihitung dari sekarang", () => {
    const sebelum = Date.now();
    const hasil = getAttemptExpiresAt({ durationMinutes: 30, endAt: new Date("2099-01-01") }, null);
    const selisih = hasil.getTime() - sebelum;
    assert.ok(selisih > 29 * 60000 && selisih <= 30 * 60000 + 1000, `selisih ${selisih}ms`);
  });
});

// ─── Bahan uji payload ──────────────────────────────────────────────────────

function opsi(id: string, order: number) {
  return {
    id,
    questionId: "q",
    optionLabel: id.toUpperCase(),
    optionText: `teks ${id}`,
    mediaUrl: null,
    isCorrect: false,
    orderNumber: order,
  };
}

function soal(id: string, order: number) {
  return {
    id: `eq-${id}`,
    examId: "exam",
    questionId: id,
    orderNumber: order,
    question: {
      id,
      questionText: `soal ${id}`,
      questionType: "MULTIPLE_CHOICE",
      mediaType: "NONE",
      mediaUrl: null,
      options: [opsi("a", 1), opsi("b", 2), opsi("c", 3), opsi("d", 4)],
    },
  };
}

function ujian(over: Record<string, unknown> = {}) {
  return {
    id: "exam",
    title: "UH Matematika",
    subject: { code: "MTK", name: "Matematika" },
    examType: "UH",
    status: "ACTIVE",
    durationMinutes: 60,
    endAt: new Date("2099-01-01"),
    randomizeQuestions: false,
    randomizeOptions: false,
    questions: ID.map((id, i) => soal(id, i + 1)),
    ...over,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

function attempt(id: string) {
  return {
    id,
    startedAt: new Date("2026-08-02T10:00:00Z"),
    status: "IN_PROGRESS",
    isLocked: false,
    lockReason: null,
    violationCount: 0,
    answers: [
      {
        questionId: ID[1],
        selectedOptionId: "b",
        answerText: null,
        isDoubtful: true,
        savedAt: new Date("2026-08-02T10:05:00Z"),
      },
    ],
  };
}

describe("buildMobileExamPayload", () => {
  test("tanpa pengacakan, urutan soal mengikuti nomor urut", () => {
    const payload = buildMobileExamPayload(ujian(), attempt("att-1"));
    assert.deepEqual(
      payload.questions.map((q) => q.id),
      ID
    );
  });

  test("pengacakan stabil: attempt yang sama selalu dapat urutan sama", () => {
    const acak = ujian({ randomizeQuestions: true });
    const a = buildMobileExamPayload(acak, attempt("att-1")).questions.map((q) => q.id);
    const b = buildMobileExamPayload(acak, attempt("att-1")).questions.map((q) => q.id);
    assert.deepEqual(a, b, "urutan berubah saat halaman dibuka ulang");
  });

  test("pengacakan berbeda antar attempt", () => {
    const acak = ujian({ randomizeQuestions: true });
    const a = buildMobileExamPayload(acak, attempt("att-1")).questions.map((q) => q.id);
    const b = buildMobileExamPayload(acak, attempt("att-2")).questions.map((q) => q.id);
    assert.notDeepEqual(a, b, "dua siswa mendapat urutan identik");
  });

  test("pengacakan tidak menghilangkan atau menggandakan soal", () => {
    const acak = ujian({ randomizeQuestions: true, randomizeOptions: true });
    const payload = buildMobileExamPayload(acak, attempt("att-9"));
    assert.deepEqual(payload.questions.map((q) => q.id).sort(), [...ID].sort());
    for (const q of payload.questions) {
      assert.deepEqual(q.options.map((o) => o.id).sort(), ["a", "b", "c", "d"]);
    }
  });

  test("kunci jawaban tidak ikut terkirim ke siswa", () => {
    const payload = buildMobileExamPayload(ujian(), attempt("att-1"));
    for (const q of payload.questions) {
      for (const o of q.options) {
        assert.ok(!("isCorrect" in o), "opsi membawa penanda jawaban benar");
      }
    }
  });

  test("jawaban tersimpan dikirim ulang sebagai peta per soal", () => {
    const payload = buildMobileExamPayload(ujian(), attempt("att-1"));
    assert.deepEqual(payload.answers[ID[1]], {
      selectedOptionId: "b",
      answerText: null,
      isDoubtful: true,
      savedAt: "2026-08-02T10:05:00.000Z",
    });
    assert.equal(payload.answers[ID[0]], undefined);
  });
});
