import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { timeRangesOverlap } from "./lesson-schedule";

describe("timeRangesOverlap", () => {
  test("mendeteksi dua jadwal yang bertumpuk", () => {
    assert.equal(timeRangesOverlap("07:00", "08:30", "08:00", "09:00"), true);
  });

  test("jadwal bersebelahan tidak dianggap bentrok", () => {
    assert.equal(timeRangesOverlap("07:00", "08:00", "08:00", "09:00"), false);
  });

  test("mendeteksi jadwal yang sepenuhnya berada di dalam jadwal lain", () => {
    assert.equal(timeRangesOverlap("07:00", "10:00", "08:00", "09:00"), true);
  });
});
