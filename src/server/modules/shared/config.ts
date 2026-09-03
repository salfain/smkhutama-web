/**
 * Pengaturan runtime yang dibaca aplikasi klien saat mulai.
 *
 * Nilainya berasal dari tabel `SystemSetting` yang bisa diubah admin tanpa
 * merilis ulang aplikasi - mis. menaikkan ambang pelanggaran atau menyalakan
 * mode pemeliharaan saat ujian bermasalah.
 */

import { prisma } from "@/lib/prisma";

const DEFAULTS = {
  maintenance: false,
  minAppVersion: "1.0.0",
  heartbeatIntervalSeconds: 30,
  maxViolationCount: 5,
  answerSyncBatchLimit: 100,
};

function boolValue(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function intValue(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function getClientConfig() {
  const settings = await prisma.systemSetting
    .findMany({ where: { category: { in: ["MOBILE", "EXAM"] } }, select: { key: true, value: true } })
    .catch(() => []);
  const map = new Map(settings.map((setting) => [setting.key, setting.value]));

  return {
    serverTime: new Date().toISOString(),
    maintenance: boolValue(map.get("mobile.maintenance"), DEFAULTS.maintenance),
    minAppVersion: map.get("mobile.min_app_version") ?? DEFAULTS.minAppVersion,
    heartbeatIntervalSeconds: intValue(
      map.get("mobile.heartbeat_interval_seconds"),
      DEFAULTS.heartbeatIntervalSeconds
    ),
    maxViolationCount: intValue(map.get("exam.max_violation_count"), DEFAULTS.maxViolationCount),
    answerSyncBatchLimit: intValue(
      map.get("mobile.answer_sync_batch_limit"),
      DEFAULTS.answerSyncBatchLimit
    ),
    features: {
      offlineAnswerQueue: true,
      essayAnswer: true,
      mediaQuestion: true,
      optionMedia: true,
      violationReport: true,
    },
  };
}
