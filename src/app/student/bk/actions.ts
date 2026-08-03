"use server";

/**
 * Server action halaman BK milik siswa.
 * Query-nya dipinjam dari `@/server/modules/bk/service`.
 */

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";
import * as bk from "@/server/modules/bk/service";

const STUDENT_BK_PATH = "/student/bk";

function text(fd: FormData, field: string) {
  return String(fd.get(field) ?? "").trim();
}

export async function getMyBkData() {
  const user = await requireAuth("STUDENT");
  if (!user.student) return null;

  const { violations, achievements, cases, requests } = await bk.getStudentBkSummary(
    user.student.id
  );
  const violationPoints = bk.sumPoints(violations);
  const achievementPoints = bk.sumPoints(achievements);

  return {
    violationPoints,
    achievementPoints,
    netPoints: achievementPoints - violationPoints,
    violations: violations.map((v) => ({
      id: v.id,
      typeName: v.violationType?.name ?? null,
      description: v.description,
      points: v.points,
      sanction: v.sanction ?? "",
      date: v.date,
    })),
    achievements: achievements.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description ?? "",
      points: a.points,
      level: a.level ?? "",
      date: a.date,
    })),
    cases: cases.map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      status: c.status,
      // sembunyikan deskripsi rinci bila ditandai rahasia
      description: c.isConfidential ? null : (c.description ?? ""),
      followUp: c.isConfidential ? null : (c.followUp ?? ""),
      isConfidential: c.isConfidential,
      sessionDate: c.sessionDate,
    })),
    requests: requests.map((r) => ({
      id: r.id,
      topic: r.topic,
      description: r.description ?? "",
      urgency: r.urgency,
      status: r.status,
      response: r.response ?? "",
      preferredDate: r.preferredDate,
      createdAt: r.createdAt,
    })),
  };
}

export async function submitCounselingRequest(fd: FormData) {
  const user = await requireAuth("STUDENT");
  if (!user.student) return { error: "Data siswa tidak ditemukan" };

  const topic = text(fd, "topic");
  if (!topic) return { error: "Topik konseling wajib diisi" };

  try {
    await bk.createRequest({
      studentId: user.student.id,
      topic,
      description: text(fd, "description"),
      urgency: text(fd, "urgency") || "SEDANG",
      preferredDate: text(fd, "preferredDate"),
    });
    revalidatePath(STUDENT_BK_PATH);
    revalidatePath("/counselor/requests");
    return { success: true };
  } catch {
    return { error: "Gagal mengirim permohonan. Coba lagi." };
  }
}

export async function cancelCounselingRequest(id: string) {
  const user = await requireAuth("STUDENT");
  if (!user.student) return { error: "Tidak diizinkan" };

  const result = await bk.cancelOwnRequest(id, user.student.id);
  if (!result.ok) {
    return {
      error:
        result.reason === "ALREADY_PROCESSED" ? "Permohonan sudah diproses" : "Tidak diizinkan",
    };
  }

  revalidatePath(STUDENT_BK_PATH);
  return { success: true };
}
