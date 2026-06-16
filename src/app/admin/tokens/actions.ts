"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTokens() {
  return prisma.examToken.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      exam: {
        select: {
          id: true, title: true, status: true,
          subject: { select: { code: true } },
          _count: { select: { attempts: true } },
        },
      },
    },
  });
}

export async function getExamsForToken() {
  return prisma.exam.findMany({
    where: { status: { in: ["DRAFT", "ACTIVE"] } },
    orderBy: { startAt: "desc" },
    select: {
      id: true, title: true, status: true, endAt: true, examType: true,
      subject: { select: { code: true } },
    },
  });
}

function generateRandomToken(prefix = ""): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return prefix ? `${prefix}-${num}` : `TKN-${num}`;
}

export async function createToken(formData: FormData) {
  const examId = String(formData.get("examId") ?? "").trim();
  const durationMinutes = Number(formData.get("durationMinutes") ?? "60");

  if (!examId) return { error: "Pilih ujian terlebih dahulu" };

  try {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { subject: { select: { code: true } } },
    });
    if (!exam) return { error: "Ujian tidak ditemukan" };

    // Generate unique token
    let token = generateRandomToken(exam.subject.code);
    let tries = 0;
    while (tries < 10) {
      const exists = await prisma.examToken.findUnique({ where: { token } });
      if (!exists) break;
      token = generateRandomToken(exam.subject.code);
      tries++;
    }

    const expiredAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    const created = await prisma.examToken.create({
      data: { examId, token, expiredAt, isActive: true },
    });

    revalidatePath("/admin/tokens");
    return { success: true, token: created.token };
  } catch {
    return { error: "Gagal generate token" };
  }
}

export async function regenerateToken(id: string) {
  try {
    const t = await prisma.examToken.findUnique({
      where: { id },
      include: { exam: { include: { subject: { select: { code: true } } } } },
    });
    if (!t) return { error: "Token tidak ditemukan" };

    let newToken = generateRandomToken(t.exam.subject.code);
    let tries = 0;
    while (tries < 10) {
      const exists = await prisma.examToken.findUnique({ where: { token: newToken } });
      if (!exists) break;
      newToken = generateRandomToken(t.exam.subject.code);
      tries++;
    }

    await prisma.examToken.update({
      where: { id },
      data: { token: newToken, isActive: true },
    });
    revalidatePath("/admin/tokens");
    return { success: true, token: newToken };
  } catch {
    return { error: "Gagal regenerate token" };
  }
}

export async function toggleTokenStatus(id: string) {
  try {
    const t = await prisma.examToken.findUnique({ where: { id } });
    if (!t) return { error: "Token tidak ditemukan" };
    await prisma.examToken.update({
      where: { id },
      data: { isActive: !t.isActive },
    });
    revalidatePath("/admin/tokens");
    return { success: true };
  } catch {
    return { error: "Gagal mengubah status token" };
  }
}

export async function deleteToken(id: string) {
  try {
    await prisma.examToken.delete({ where: { id } });
    revalidatePath("/admin/tokens");
    return { success: true };
  } catch {
    return { error: "Gagal menghapus token" };
  }
}
