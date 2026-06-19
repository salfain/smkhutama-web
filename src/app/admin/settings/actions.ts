"use server";

import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export type Settings = {
  max_image_size: string;
  max_audio_size: string;
  max_video_size: string;
  autosave_interval: string;
  default_exam_duration: string;
  enable_doubtful: string;
  show_question_numbers: string;
  allow_free_navigation: string;
  auto_submit_on_timeout: string;
  show_result_default: string;
};

const DEFAULT_SETTINGS: Settings = {
  max_image_size: "2048",
  max_audio_size: "10240",
  max_video_size: "51200",
  autosave_interval: "30",
  default_exam_duration: "90",
  enable_doubtful: "true",
  show_question_numbers: "true",
  allow_free_navigation: "true",
  auto_submit_on_timeout: "true",
  show_result_default: "false",
};

export async function getSettings(): Promise<Settings> {
  const all = await prisma.systemSetting.findMany();
  const map = new Map(all.map((s) => [s.key, s.value]));
  const result = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const v = map.get(key);
    if (v !== undefined) result[key] = v;
  }
  return result;
}

export async function saveSettings(formData: FormData) {
  const keys = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[];
  const checkboxKeys = [
    "enable_doubtful",
    "show_question_numbers",
    "allow_free_navigation",
    "auto_submit_on_timeout",
    "show_result_default",
  ];

  try {
    const changed: Record<string, string> = {};
    for (const key of keys) {
      const isCheckbox = checkboxKeys.includes(key);
      const value = isCheckbox
        ? (formData.get(key) === "on" ? "true" : "false")
        : String(formData.get(key) ?? "").trim();
      changed[key] = value;
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value, category: "exam" },
      });
    }
    await logAudit({
      action: "UPDATE_SYSTEM_SETTINGS",
      entity: "systemSetting",
      details: changed,
    });
    revalidatePath("/admin/settings");
    return { success: true };
  } catch {
    return { error: "Gagal menyimpan pengaturan" };
  }
}

export async function backupDatabase() {
  // Stub: hitung statistik untuk simulasi backup
  const [users, exams, attempts] = await Promise.all([
    prisma.user.count(),
    prisma.exam.count(),
    prisma.studentExamAttempt.count(),
  ]);
  return {
    success: true,
    stats: { users, exams, attempts },
    timestamp: new Date().toISOString(),
  };
}
