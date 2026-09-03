"use server";

/**
 * Saklar pintu masuk siswa ke sistem CBT.
 *
 * Nilainya dibaca saat login - web lewat `src/app/login/actions.ts`, aplikasi
 * mobile lewat `@/server/modules/auth/service` - jadi perubahan di sini langsung
 * berlaku tanpa perlu deploy ulang.
 */

import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type StudentAccess = {
  allow_student_web_login: boolean;
  allow_student_mobile_login: boolean;
};

const DEFAULTS: StudentAccess = {
  allow_student_web_login: false,
  allow_student_mobile_login: true,
};

export async function getStudentAccess(): Promise<StudentAccess> {
  await requireAuth("ADMIN_CBT");
  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: Object.keys(DEFAULTS) } },
    select: { key: true, value: true },
  });
  const map = new Map(rows.map((row) => [row.key, row.value]));
  return {
    allow_student_web_login: map.has("allow_student_web_login")
      ? map.get("allow_student_web_login") === "true"
      : DEFAULTS.allow_student_web_login,
    allow_student_mobile_login: map.has("allow_student_mobile_login")
      ? map.get("allow_student_mobile_login") === "true"
      : DEFAULTS.allow_student_mobile_login,
  };
}

export async function setStudentAccess(key: keyof StudentAccess, enabled: boolean) {
  await requireAuth("ADMIN_CBT");
  try {
    const value = enabled ? "true" : "false";
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, category: "auth" },
    });
    await logAudit({
      action: "UPDATE_STUDENT_ACCESS",
      entity: "systemSetting",
      entityId: key,
      details: { [key]: value },
    });
    revalidatePath("/admin/student-access");
    return { success: true as const };
  } catch {
    return { error: "Gagal menyimpan perubahan" };
  }
}
