/**
 * Rentang tanggal harian - dipakai seluruh pencatatan piket.
 * Batas harinya mengikuti zona waktu proses; lihat catatan di `date-range.ts`.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { dayRange, isDateOnly, todayDateOnly } from "./date-range";

describe("dayRange", () => {
  test("awal hari di 00:00:00.000 dan akhir di 23:59:59.999", () => {
    const { start, end } = dayRange("2026-08-02T15:30:00");
    assert.equal(start.getHours(), 0);
    assert.equal(start.getMinutes(), 0);
    assert.equal(start.getSeconds(), 0);
    assert.equal(start.getMilliseconds(), 0);
    assert.equal(end.getHours(), 23);
    assert.equal(end.getMinutes(), 59);
    assert.equal(end.getSeconds(), 59);
    assert.equal(end.getMilliseconds(), 999);
  });

  test("keduanya jatuh pada tanggal yang sama", () => {
    const { start, end } = dayRange("2026-08-02");
    assert.equal(start.getDate(), end.getDate());
    assert.equal(start.getMonth(), end.getMonth());
  });

  test("masukan tak terbaca jatuh ke hari ini, bukan Invalid Date", () => {
    const { start, end } = dayRange("bukan-tanggal");
    assert.ok(!Number.isNaN(start.getTime()));
    assert.ok(!Number.isNaN(end.getTime()));
    assert.equal(start.getDate(), new Date().getDate());
  });

  test("tanpa argumen memakai hari ini", () => {
    for (const kosong of [undefined, null, ""]) {
      const { start } = dayRange(kosong);
      assert.equal(start.getDate(), new Date().getDate());
    }
  });
});

describe("isDateOnly", () => {
  test("hanya menerima YYYY-MM-DD", () => {
    assert.equal(isDateOnly("2026-08-02"), true);
    assert.equal(isDateOnly("2026-08-02T10:00:00"), false);
    assert.equal(isDateOnly("02-08-2026"), false);
    assert.equal(isDateOnly(""), false);
    assert.equal(isDateOnly(null), false);
    assert.equal(isDateOnly(20260802), false);
  });
});

describe("todayDateOnly", () => {
  test("berbentuk YYYY-MM-DD", () => {
    assert.ok(isDateOnly(todayDateOnly()));
  });
});
