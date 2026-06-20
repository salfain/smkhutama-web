import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function boolValue(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function intValue(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET() {
  const settings = await prisma.systemSetting.findMany({
    where: { category: { in: ["MOBILE", "EXAM"] } },
    select: { key: true, value: true },
  }).catch(() => []);
  const map = new Map(settings.map((setting) => [setting.key, setting.value]));

  return NextResponse.json({
    serverTime: new Date().toISOString(),
    maintenance: boolValue(map.get("mobile.maintenance"), false),
    minAppVersion: map.get("mobile.min_app_version") ?? "1.0.0",
    heartbeatIntervalSeconds: intValue(map.get("mobile.heartbeat_interval_seconds"), 30),
    maxViolationCount: intValue(map.get("exam.max_violation_count"), 5),
    answerSyncBatchLimit: intValue(map.get("mobile.answer_sync_batch_limit"), 100),
    features: {
      offlineAnswerQueue: true,
      essayAnswer: true,
      mediaQuestion: true,
      optionMedia: true,
      violationReport: true,
    },
  });
}
