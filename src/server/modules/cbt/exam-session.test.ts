/**
 * Aturan siapa boleh mengerjakan ujian dan kapan. Salah di sini berarti siswa
 * terkunci di luar ujiannya sendiri, atau sebaliknya bisa masuk ujian kelas lain.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { checkExamAccess, isSubmitted } from "./exam-session";

const KEMARIN = new Date("2026-08-01T00:00:00Z");
const SEKARANG = new Date("2026-08-02T10:00:00Z");
const BESOK = new Date("2026-08-03T00:00:00Z");

function ujian(over: Partial<Parameters<typeof checkExamAccess>[0]> = {}) {
  return {
    status: "ACTIVE",
    startAt: KEMARIN,
    endAt: BESOK,
    classes: [{ classId: "kelas-a" }],
    ...over,
  };
}

describe("checkExamAccess", () => {
  test("peserta yang sah pada jam ujian → tidak ada kendala", () => {
    assert.equal(checkExamAccess(ujian(), "kelas-a", SEKARANG), null);
  });

  test("ujian tidak ada", () => {
    assert.equal(checkExamAccess(null, "kelas-a", SEKARANG), "EXAM_NOT_FOUND");
  });

  test("ujian masih draf", () => {
    assert.equal(
      checkExamAccess(ujian({ status: "DRAFT" }), "kelas-a", SEKARANG),
      "EXAM_NOT_ACTIVE"
    );
  });

  test("ujian sudah ditutup", () => {
    assert.equal(
      checkExamAccess(ujian({ status: "CLOSED" }), "kelas-a", SEKARANG),
      "EXAM_NOT_ACTIVE"
    );
  });

  test("belum masuk waktu mulai", () => {
    assert.equal(
      checkExamAccess(ujian({ startAt: BESOK }), "kelas-a", SEKARANG),
      "EXAM_NOT_STARTED"
    );
  });

  test("sudah lewat waktu berakhir", () => {
    assert.equal(
      checkExamAccess(ujian({ endAt: KEMARIN }), "kelas-a", SEKARANG),
      "EXAM_ENDED"
    );
  });

  test("siswa dari kelas lain ditolak", () => {
    assert.equal(checkExamAccess(ujian(), "kelas-b", SEKARANG), "NOT_PARTICIPANT");
  });

  test("siswa tanpa kelas ditolak bila ujian membatasi kelas", () => {
    assert.equal(checkExamAccess(ujian(), null, SEKARANG), "NOT_PARTICIPANT");
  });

  test("ujian tanpa daftar kelas terbuka untuk semua siswa", () => {
    assert.equal(checkExamAccess(ujian({ classes: [] }), null, SEKARANG), null);
    assert.equal(checkExamAccess(ujian({ classes: [] }), "kelas-z", SEKARANG), null);
  });

  test("tepat pada detik mulai sudah boleh masuk", () => {
    assert.equal(checkExamAccess(ujian({ startAt: SEKARANG }), "kelas-a", SEKARANG), null);
  });

  test("tepat pada detik berakhir masih boleh", () => {
    assert.equal(checkExamAccess(ujian({ endAt: SEKARANG }), "kelas-a", SEKARANG), null);
  });

  test("ujian belum aktif diperiksa lebih dulu daripada keanggotaan kelas", () => {
    // Urutan ini menentukan pesan mana yang dilihat siswa.
    assert.equal(
      checkExamAccess(ujian({ status: "DRAFT" }), "kelas-b", SEKARANG),
      "EXAM_NOT_ACTIVE"
    );
  });
});

describe("isSubmitted", () => {
  test("status yang dianggap sudah dikumpulkan", () => {
    assert.equal(isSubmitted("SUBMITTED"), true);
    assert.equal(isSubmitted("AUTO_SUBMITTED"), true);
  });

  test("status yang masih berjalan", () => {
    assert.equal(isSubmitted("IN_PROGRESS"), false);
    assert.equal(isSubmitted("NOT_STARTED"), false);
  });
});
