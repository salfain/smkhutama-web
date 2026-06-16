"use server";

import { prisma } from "@/lib/prisma";
import { requireCounselorAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";

/** Pastikan ada record Counselor untuk user yang login (auto-create bila belum ada). */
async function currentCounselorId(): Promise<string> {
  const user = await requireCounselorAuth();
  const existing = await prisma.counselor.findUnique({ where: { userId: user.id } });
  if (existing) return existing.id;
  const created = await prisma.counselor.create({ data: { userId: user.id } });
  return created.id;
}

export async function listStudents() {
  await requireCounselorAuth();
  const students = await prisma.student.findMany({
    include: { user: { select: { name: true } }, class: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });
  return students.map((s) => ({
    id: s.id,
    name: s.user.name,
    nis: s.nis ?? "",
    className: s.class?.name ?? "-",
  }));
}

// ---------- DASHBOARD ----------
export async function getDashboardStats() {
  await requireCounselorAuth();
  const [openCases, totalCases, totalViolations, totalAchievements, recentCases] = await Promise.all([
    prisma.counselingCase.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.counselingCase.count(),
    prisma.violationRecord.count(),
    prisma.achievementRecord.count(),
    prisma.counselingCase.findMany({
      take: 5,
      orderBy: { sessionDate: "desc" },
      include: { student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } } },
    }),
  ]);

  const pendingRequests = await prisma.counselingRequest.count({ where: { status: "PENDING" } });

  // Top siswa berdasarkan poin pelanggaran
  const violationsByStudent = await prisma.violationRecord.groupBy({
    by: ["studentId"],
    _sum: { points: true },
    orderBy: { _sum: { points: "desc" } },
    take: 5,
  });
  const topStudents = await Promise.all(
    violationsByStudent.map(async (v) => {
      const s = await prisma.student.findUnique({
        where: { id: v.studentId },
        include: { user: { select: { name: true } }, class: { select: { name: true } } },
      });
      return { name: s?.user.name ?? "?", className: s?.class?.name ?? "-", points: v._sum.points ?? 0 };
    })
  );

  return {
    openCases, totalCases, totalViolations, totalAchievements, pendingRequests,
    recentCases: recentCases.map((c) => ({
      id: c.id, title: c.title, type: c.type, status: c.status,
      studentName: c.student.user.name, className: c.student.class?.name ?? "-",
      sessionDate: c.sessionDate,
    })),
    topStudents,
  };
}

// ---------- CASES ----------
export async function listCases() {
  await requireCounselorAuth();
  const cases = await prisma.counselingCase.findMany({
    orderBy: { sessionDate: "desc" },
    include: { student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } } },
  });
  return cases.map((c) => ({
    id: c.id, studentId: c.studentId, studentName: c.student.user.name,
    className: c.student.class?.name ?? "-", type: c.type, status: c.status,
    title: c.title, description: c.description ?? "", notes: c.notes ?? "", followUp: c.followUp ?? "",
    isConfidential: c.isConfidential, sessionDate: c.sessionDate,
  }));
}

export async function saveCase(fd: FormData) {
  const counselorId = await currentCounselorId();
  const id = String(fd.get("id") ?? "").trim();
  const studentId = String(fd.get("studentId") ?? "").trim();
  const type = String(fd.get("type") ?? "PRIBADI") as "PRIBADI" | "SOSIAL" | "BELAJAR" | "KARIR";
  const status = String(fd.get("status") ?? "OPEN") as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "REFERRED";
  const title = String(fd.get("title") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  const notes = String(fd.get("notes") ?? "").trim();
  const followUp = String(fd.get("followUp") ?? "").trim();
  const isConfidential = fd.get("isConfidential") === "on";
  const sessionDate = String(fd.get("sessionDate") ?? "").trim();
  if (!studentId || !title) return { error: "Siswa dan judul wajib diisi" };

  const data = {
    type, status, title,
    description: description || null,
    notes: notes || null,
    followUp: followUp || null,
    isConfidential,
    sessionDate: sessionDate ? new Date(sessionDate) : new Date(),
  };
  try {
    if (id) await prisma.counselingCase.update({ where: { id }, data });
    else await prisma.counselingCase.create({ data: { ...data, studentId, counselorId } });
    revalidatePath("/counselor/cases");
    revalidatePath("/counselor/dashboard");
    return { success: true };
  } catch {
    return { error: "Gagal menyimpan kasus konseling" };
  }
}

export async function deleteCase(id: string) {
  await requireCounselorAuth();
  await prisma.counselingCase.delete({ where: { id } });
  revalidatePath("/counselor/cases");
  revalidatePath("/counselor/dashboard");
  return { success: true };
}

// ---------- VIOLATION TYPES (master) ----------
export async function listViolationTypes() {
  await requireCounselorAuth();
  return prisma.violationType.findMany({ orderBy: [{ category: "asc" }, { points: "desc" }] });
}

export async function saveViolationType(fd: FormData) {
  await requireCounselorAuth();
  const id = String(fd.get("id") ?? "").trim();
  const name = String(fd.get("name") ?? "").trim();
  const category = String(fd.get("category") ?? "RINGAN") as "RINGAN" | "SEDANG" | "BERAT";
  const points = parseInt(String(fd.get("points") ?? "0"), 10) || 0;
  if (!name) return { error: "Nama pelanggaran wajib diisi" };
  const data = { name, category, points };
  if (id) await prisma.violationType.update({ where: { id }, data });
  else await prisma.violationType.create({ data });
  revalidatePath("/counselor/violations");
  return { success: true };
}

export async function deleteViolationType(id: string) {
  await requireCounselorAuth();
  await prisma.violationType.delete({ where: { id } });
  revalidatePath("/counselor/violations");
  return { success: true };
}

// ---------- VIOLATION RECORDS ----------
export async function listViolations() {
  await requireCounselorAuth();
  const rows = await prisma.violationRecord.findMany({
    orderBy: { date: "desc" },
    include: {
      student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } },
      violationType: { select: { name: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id, studentId: r.studentId, studentName: r.student.user.name,
    className: r.student.class?.name ?? "-",
    typeName: r.violationType?.name ?? null,
    description: r.description, points: r.points, sanction: r.sanction ?? "", date: r.date,
  }));
}

export async function saveViolation(fd: FormData) {
  const counselorId = await currentCounselorId();
  const id = String(fd.get("id") ?? "").trim();
  const studentId = String(fd.get("studentId") ?? "").trim();
  const violationTypeId = String(fd.get("violationTypeId") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  const points = parseInt(String(fd.get("points") ?? "0"), 10) || 0;
  const sanction = String(fd.get("sanction") ?? "").trim();
  const date = String(fd.get("date") ?? "").trim();
  if (!studentId || !description) return { error: "Siswa dan deskripsi wajib diisi" };
  const data = {
    violationTypeId: violationTypeId || null,
    description, points, sanction: sanction || null,
    date: date ? new Date(date) : new Date(),
  };
  try {
    if (id) await prisma.violationRecord.update({ where: { id }, data });
    else await prisma.violationRecord.create({ data: { ...data, studentId, counselorId } });
    revalidatePath("/counselor/violations");
    revalidatePath("/counselor/dashboard");
    return { success: true };
  } catch {
    return { error: "Gagal menyimpan pelanggaran" };
  }
}

export async function deleteViolation(id: string) {
  await requireCounselorAuth();
  await prisma.violationRecord.delete({ where: { id } });
  revalidatePath("/counselor/violations");
  revalidatePath("/counselor/dashboard");
  return { success: true };
}

// ---------- ACHIEVEMENT RECORDS ----------
export async function listAchievements() {
  await requireCounselorAuth();
  const rows = await prisma.achievementRecord.findMany({
    orderBy: { date: "desc" },
    include: { student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } } },
  });
  return rows.map((r) => ({
    id: r.id, studentId: r.studentId, studentName: r.student.user.name,
    className: r.student.class?.name ?? "-",
    title: r.title, description: r.description ?? "", points: r.points,
    level: r.level ?? "", date: r.date,
  }));
}

export async function saveAchievement(fd: FormData) {
  const counselorId = await currentCounselorId();
  const id = String(fd.get("id") ?? "").trim();
  const studentId = String(fd.get("studentId") ?? "").trim();
  const title = String(fd.get("title") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  const points = parseInt(String(fd.get("points") ?? "0"), 10) || 0;
  const level = String(fd.get("level") ?? "").trim();
  const date = String(fd.get("date") ?? "").trim();
  if (!studentId || !title) return { error: "Siswa dan judul prestasi wajib diisi" };
  const data = {
    title, description: description || null, points, level: level || null,
    date: date ? new Date(date) : new Date(),
  };
  try {
    if (id) await prisma.achievementRecord.update({ where: { id }, data });
    else await prisma.achievementRecord.create({ data: { ...data, studentId, counselorId } });
    revalidatePath("/counselor/achievements");
    revalidatePath("/counselor/dashboard");
    return { success: true };
  } catch {
    return { error: "Gagal menyimpan prestasi" };
  }
}

export async function deleteAchievement(id: string) {
  await requireCounselorAuth();
  await prisma.achievementRecord.delete({ where: { id } });
  revalidatePath("/counselor/achievements");
  revalidatePath("/counselor/dashboard");
  return { success: true };
}

// ---------- COUNSELING REQUESTS (dari siswa) ----------
export async function listRequests() {
  await requireCounselorAuth();
  const rows = await prisma.counselingRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } } },
  });
  return rows.map((r) => ({
    id: r.id, studentName: r.student.user.name, className: r.student.class?.name ?? "-",
    topic: r.topic, description: r.description ?? "", urgency: r.urgency,
    status: r.status, response: r.response ?? "",
    preferredDate: r.preferredDate, createdAt: r.createdAt,
  }));
}

export async function respondRequest(fd: FormData) {
  await requireCounselorAuth();
  const id = String(fd.get("id") ?? "").trim();
  const status = String(fd.get("status") ?? "PENDING") as "PENDING" | "APPROVED" | "SCHEDULED" | "DONE" | "REJECTED";
  const response = String(fd.get("response") ?? "").trim();
  if (!id) return { error: "Permohonan tidak ditemukan" };
  await prisma.counselingRequest.update({
    where: { id },
    data: { status, response: response || null },
  });
  revalidatePath("/counselor/requests");
  revalidatePath("/counselor/dashboard");
  return { success: true };
}

/** Terima permohonan & langsung buat sesi konseling dari datanya. */
export async function convertRequestToCase(id: string) {
  const counselorId = await currentCounselorId();
  const req = await prisma.counselingRequest.findUnique({
    where: { id },
    include: { student: true },
  });
  if (!req) return { error: "Permohonan tidak ditemukan" };

  await prisma.$transaction([
    prisma.counselingCase.create({
      data: {
        studentId: req.studentId,
        counselorId,
        type: "PRIBADI",
        status: "IN_PROGRESS",
        title: req.topic,
        description: req.description || null,
        sessionDate: req.preferredDate ?? new Date(),
        isConfidential: true,
      },
    }),
    prisma.counselingRequest.update({
      where: { id },
      data: {
        status: "SCHEDULED",
        response: req.response || "Permohonan diterima. Sesi konseling telah dijadwalkan.",
      },
    }),
  ]);

  revalidatePath("/counselor/requests");
  revalidatePath("/counselor/cases");
  revalidatePath("/counselor/dashboard");
  revalidatePath("/student/bk");
  return { success: true };
}

/** Ambil detail sesi konseling untuk cetak/PDF. */
export async function getCaseDetail(id: string) {
  await requireCounselorAuth();
  const c = await prisma.counselingCase.findUnique({
    where: { id },
    include: {
      student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } },
      counselor: { include: { user: { select: { name: true } } } },
    },
  });
  if (!c) return null;
  return {
    id: c.id,
    title: c.title,
    type: c.type,
    status: c.status,
    description: c.description ?? "",
    notes: c.notes ?? "",
    followUp: c.followUp ?? "",
    isConfidential: c.isConfidential,
    sessionDate: c.sessionDate,
    studentName: c.student.user.name,
    studentNis: c.student.nis ?? "",
    className: c.student.class?.name ?? "-",
    counselorName: c.counselor.user.name,
  };
}
