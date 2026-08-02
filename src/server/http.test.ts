/**
 * Pembaca field body request. Ini pintu masuk data dari luar, jadi yang diuji
 * bukan jalur normalnya saja tapi juga bentuk kiriman yang aneh.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ApiError, boolField, intField, oneOf, optionalString, requiredString } from "./http";

const STATUS = ["OPEN", "CLOSED"] as const;

describe("requiredString", () => {
  test("memangkas spasi di ujung", () => {
    assert.equal(requiredString({ nama: "  Andi  " }, "nama"), "Andi");
  });

  test("menolak string kosong, spasi saja, dan field yang hilang", () => {
    for (const body of [{ nama: "" }, { nama: "   " }, {}]) {
      assert.throws(() => requiredString(body, "nama"), ApiError);
    }
  });

  test("menolak angka — bukan sekadar mengubahnya jadi teks", () => {
    assert.throws(() => requiredString({ nama: 123 }, "nama"), ApiError);
  });
});

describe("optionalString", () => {
  test("string kosong dianggap tidak diisi", () => {
    assert.equal(optionalString({ ket: "   " }, "ket"), null);
    assert.equal(optionalString({}, "ket"), null);
  });

  test("isi yang sah dipangkas", () => {
    assert.equal(optionalString({ ket: " catatan " }, "ket"), "catatan");
  });
});

describe("intField", () => {
  test("menerima angka maupun teks angka", () => {
    assert.equal(intField({ poin: 10 }, "poin"), 10);
    assert.equal(intField({ poin: "25" }, "poin"), 25);
  });

  test("memotong pecahan, tidak membulatkan", () => {
    assert.equal(intField({ poin: 7.9 }, "poin"), 7);
  });

  test("nilai negatif dibiarkan — pembatasan urusan pemanggil", () => {
    assert.equal(intField({ poin: -5 }, "poin"), -5);
  });

  test("nilai tak terbaca jatuh ke bawaan", () => {
    assert.equal(intField({ poin: "abc" }, "poin"), 0);
    assert.equal(intField({}, "poin", 3), 3);
    assert.equal(intField({ poin: null }, "poin", 3), 3);
  });
});

describe("boolField", () => {
  test("boolean asli", () => {
    assert.equal(boolField({ aktif: true }, "aktif"), true);
    assert.equal(boolField({ aktif: false }, "aktif", true), false);
  });

  test("bentuk teks yang lazim dari formulir", () => {
    for (const v of ["true", "TRUE", "1", "on", "yes"]) {
      assert.equal(boolField({ aktif: v }, "aktif"), true, v);
    }
    for (const v of ["false", "0", "off", ""]) {
      assert.equal(boolField({ aktif: v }, "aktif", true), false, v);
    }
  });

  test("field hilang memakai bawaan", () => {
    assert.equal(boolField({}, "aktif", true), true);
    assert.equal(boolField({}, "aktif"), false);
  });
});

describe("oneOf", () => {
  test("nilai yang diizinkan diteruskan", () => {
    assert.equal(oneOf({ status: "OPEN" }, "status", STATUS), "OPEN");
    assert.equal(oneOf({ status: " CLOSED " }, "status", STATUS), "CLOSED");
  });

  test("field kosong memakai bawaan bila disediakan", () => {
    assert.equal(oneOf({}, "status", STATUS, "OPEN"), "OPEN");
  });

  test("nilai di luar daftar tetap ditolak walau ada bawaan", () => {
    // Penting: bawaan hanya untuk field kosong, bukan untuk menutupi salah ketik.
    assert.throws(() => oneOf({ status: "NGAWUR" }, "status", STATUS, "OPEN"), ApiError);
  });

  test("tanpa bawaan, field kosong ditolak", () => {
    assert.throws(() => oneOf({}, "status", STATUS), ApiError);
  });

  test("pesan menyebutkan pilihan yang sah", () => {
    try {
      oneOf({ status: "X" }, "status", STATUS);
      assert.fail("seharusnya melempar");
    } catch (err) {
      assert.ok(err instanceof ApiError);
      assert.match(err.message, /OPEN, CLOSED/);
      assert.equal(err.status, 400);
    }
  });
});
