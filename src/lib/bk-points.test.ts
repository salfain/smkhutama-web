/**
 * Ambang poin pelanggaran → rekomendasi surat peringatan.
 * Salah ambang berarti siswa dipanggil orang tuanya terlalu cepat, atau
 * sebaliknya lolos padahal sudah melewati batas.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { recommendedLevel } from "./bk-points";

describe("recommendedLevel", () => {
  test("di bawah 25 poin belum ada rekomendasi", () => {
    for (const poin of [0, 1, 24]) {
      assert.equal(recommendedLevel(poin), null, `poin ${poin}`);
    }
  });

  test("tepat di ambang sudah memicu tingkat itu", () => {
    assert.equal(recommendedLevel(25)?.level, "SP1");
    assert.equal(recommendedLevel(50)?.level, "SP2");
    assert.equal(recommendedLevel(75)?.level, "SP3");
    assert.equal(recommendedLevel(100)?.level, "PANGGILAN");
  });

  test("satu poin di bawah ambang masih tingkat sebelumnya", () => {
    assert.equal(recommendedLevel(49)?.level, "SP1");
    assert.equal(recommendedLevel(74)?.level, "SP2");
    assert.equal(recommendedLevel(99)?.level, "SP3");
  });

  test("poin sangat tinggi berhenti di pemanggilan orang tua", () => {
    assert.equal(recommendedLevel(1000)?.level, "PANGGILAN");
  });

  test("rekomendasi membawa label yang bisa langsung ditampilkan", () => {
    assert.equal(recommendedLevel(30)?.label, "Surat Peringatan 1 (SP1)");
    assert.equal(recommendedLevel(120)?.label, "Pemanggilan Orang Tua");
  });
});
