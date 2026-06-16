"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getMyBkData() {
  const user = await requireAuth("STUDENT");
  if (!user.student) return null;
  const studentId = user.student.id;

  const [violations, achievements, cases, requests] = await Promise.all([
    prisma.violationRecord.findMany({
      where: { studentId },
      orderBy: { date: "desc" },
      include: { violationType: { select: { name: true } } },
    }),
    prisma.achievementRecord.findMany({ where: { studentId }, orderBy: { date: "desc" } }),
    prisma.counselingCase.findMany({ where: { studentId }, orderBy: { sessionDate: "desc" } }),
    prisma.counselingRequest.findMany({ where: { studentId }, orderBy: { createdAt: "desc" } }),
  ]);

  const violationPoints = violations.reduce((sum, v) => sum + v.points, 0);
  const achievementPoints = achievements.reduce((sum, a) => sum + a.points, 0);

  return {
    violationPoints,
    achievementPoints,
    netPoints: achievementPoints - violationPoints,
    violations: violations.map((v) => ({
      id: v.id, typeName: v.violationType?.name ?? null,
      description: v.description, points: v.points, sanction: v.sanction ?? "", date: v.date,
    })),
    achievements: achievements.map((a) => ({
      id: a.id, title: a.title, description: a.description ?? "",
      points: a.points, level: a.level ?? "", date: a.date,
    })),
    cases: cases.map((c) => ({
      id: c.id, title: c.title, type: c.type, status: c.status,
      // sembunyikan deskripsi rinci bila ditandai rahasia
      description: c.isConfidential ? null : (c.description ?? ""),
      followUp: c.isConfidential ? null : (c.followUp ?? ""),
      isConfidential: c.isConfidential, sessionDate: c.sessionDate,
    })),
    requests: requests.map((r) => ({
      id: r.id, topic: r.topic, description: r.description ?? "",
      urgency: r.urgency, status: r.status, response: r.response ?? "",
      preferredDate: r.preferredDate, createdAt: r.createdAt,
    })),
  };
}

export async function submitCounselingRequest(fd: FormData) {
  const user = await requireAuth("STUDENT");
  if (!user.student) return { error: "Data siswa tidak ditemukan" };
  const topic = String(fd.get("topic") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  const urgency = String(fd.get("urgency") ?? "SEDANG").trim();
  const preferredDate = String(fd.get("preferredDate") ?? "").trim();
  if (!topic) return { error: "Topik konseling wajib diisi" };
  try {
    await prisma.counselingRequest.create({
      data: {
        studentId: user.student.id,
        topic,
        description: description || null,
        urgency,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        status: "PENDING",
      },
    });
    revalidatePath("/student/bk");
    revalidatePath("/counselor/requests");
    return { success: true };
  } catch {
    return { error: "Gagal mengirim permohonan. Coba lagi." };
  }
}

export async function cancelCounselingRequest(id: string) {
  const user = await requireAuth("STUDENT");
  if (!user.student) return { error: "Tidak diizinkan" };
  // hanya boleh hapus permohonan milik sendiri yang masih PENDING
  const req = await prisma.counselingRequest.findUnique({ where: { id } });
  if (!req || req.studentId !== user.student.id) return { error: "Tidak diizinkan" };
  if (req.status !== "PENDING") return { error: "Permohonan sudah diproses" };
  await prisma.counselingRequest.delete({ where: { id } });
  revalidatePath("/student/bk");
  return { success: true };
}
