"use server";

import { prisma } from "@/lib/prisma";
import { requireCounselorAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";

async function currentCounselorId(): Promise<string> {
  const user = await requireCounselorAuth();
  const existing = await prisma.counselor.findUnique({ where: { userId: user.id } });
  if (existing) return existing.id;
  const created = await prisma.counselor.create({ data: { userId: user.id } });
  return created.id;
}

// ============= BUKU SISWA =============
export async function listStudentsWithPoints() {
  await requireCounselorAuth();
  const students = await prisma.student.findMany({
    include: {
      user: { select: { name: true } },
      class: { select: { name: true } },
      violationRecords: { select: { points: true } },
      achievementRecords: { select: { points: true } },
      counselingCases: { select: { id: true } },
    },
    orderBy: { user: { name: "asc" } },
  });
  return students.map((s) => ({
    id: s.id, name: s.user.name, nis: s.nis ?? "", className: s.class?.name ?? "-",
    violationPoints: s.violationRecords.reduce((a, v) => a + v.points, 0),
    achievementPoints: s.achievementRecords.reduce((a, v) => a + v.points, 0),
    cases: s.counselingCases.length,
  }));
}

export async function getStudentBook(studentId: string) {
  await requireCounselorAuth();
  const s = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { name: true, email: true } },
      class: { select: { name: true } },
      major: { select: { name: true } },
      violationRecords: { orderBy: { date: "desc" }, include: { violationType: { select: { name: true } } } },
      achievementRecords: { orderBy: { date: "desc" } },
      counselingCases: { orderBy: { sessionDate: "desc" } },
      homeVisits: { orderBy: { visitDate: "desc" } },
      parentSummons: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!s) return null;
  const violationPoints = s.violationRecords.reduce((a, v) => a + v.points, 0);
  const achievementPoints = s.achievementRecords.reduce((a, v) => a + v.points, 0);
  return {
    id: s.id, name: s.user.name, nis: s.nis ?? "", nisn: s.nisn ?? "",
    className: s.class?.name ?? "-", major: s.major?.name ?? "-",
    gender: s.gender, violationPoints, achievementPoints, netPoints: achievementPoints - violationPoints,
    violations: s.violationRecords.map((v) => ({ id: v.id, typeName: v.violationType?.name ?? null, description: v.description, points: v.points, sanction: v.sanction ?? "", date: v.date })),
    achievements: s.achievementRecords.map((a) => ({ id: a.id, title: a.title, description: a.description ?? "", points: a.points, level: a.level ?? "", date: a.date })),
    cases: s.counselingCases.map((c) => ({ id: c.id, title: c.title, type: c.type, status: c.status, sessionDate: c.sessionDate })),
    homeVisits: s.homeVisits.map((h) => ({ id: h.id, purpose: h.purpose, visitDate: h.visitDate, result: h.result ?? "" })),
    summons: s.parentSummons.map((p) => ({ id: p.id, level: p.level, reason: p.reason, status: p.status, createdAt: p.createdAt })),
  };
}

// ============= KUNJUNGAN RUMAH =============
export async function listHomeVisits() {
  await requireCounselorAuth();
  const rows = await prisma.homeVisit.findMany({
    orderBy: { visitDate: "desc" },
    include: { student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } } },
  });
  return rows.map((h) => ({
    id: h.id, studentId: h.studentId, studentName: h.student.user.name, className: h.student.class?.name ?? "-",
    visitDate: h.visitDate, purpose: h.purpose, address: h.address ?? "", findings: h.findings ?? "", result: h.result ?? "",
  }));
}

export async function saveHomeVisit(fd: FormData) {
  const counselorId = await currentCounselorId();
  const id = String(fd.get("id") ?? "").trim();
  const studentId = String(fd.get("studentId") ?? "").trim();
  const visitDate = String(fd.get("visitDate") ?? "").trim();
  const purpose = String(fd.get("purpose") ?? "").trim();
  const address = String(fd.get("address") ?? "").trim();
  const findings = String(fd.get("findings") ?? "").trim();
  const result = String(fd.get("result") ?? "").trim();
  if (!studentId || !purpose) return { error: "Siswa dan tujuan wajib diisi" };
  const data = {
    visitDate: visitDate ? new Date(visitDate) : new Date(),
    purpose, address: address || null, findings: findings || null, result: result || null,
  };
  if (id) await prisma.homeVisit.update({ where: { id }, data });
  else await prisma.homeVisit.create({ data: { ...data, studentId, counselorId } });
  revalidatePath("/counselor/home-visits");
  return { success: true };
}

export async function deleteHomeVisit(id: string) {
  await requireCounselorAuth();
  await prisma.homeVisit.delete({ where: { id } });
  revalidatePath("/counselor/home-visits");
  return { success: true };
}

export async function getHomeVisitDetail(id: string) {
  await requireCounselorAuth();
  const h = await prisma.homeVisit.findUnique({
    where: { id },
    include: {
      student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } },
      counselor: { include: { user: { select: { name: true } } } },
    },
  });
  if (!h) return null;
  return {
    id: h.id, visitDate: h.visitDate, purpose: h.purpose, address: h.address ?? "",
    findings: h.findings ?? "", result: h.result ?? "",
    studentName: h.student.user.name, studentNis: h.student.nis ?? "",
    className: h.student.class?.name ?? "-", counselorName: h.counselor.user.name,
  };
}

// ============= AGENDA =============
export async function getAgenda() {
  await requireCounselorAuth();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [cases, requests, summons] = await Promise.all([
    prisma.counselingCase.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] }, sessionDate: { gte: start } },
      orderBy: { sessionDate: "asc" },
      include: { student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } } },
    }),
    prisma.counselingRequest.findMany({
      where: { status: { in: ["APPROVED", "SCHEDULED"] }, preferredDate: { gte: start } },
      orderBy: { preferredDate: "asc" },
      include: { student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } } },
    }),
    prisma.parentSummon.findMany({
      where: { meetingDate: { gte: start }, status: { in: ["PENDING", "SENT"] } },
      orderBy: { meetingDate: "asc" },
      include: { student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } } },
    }),
  ]);

  const items = [
    ...cases.map((c) => ({ id: c.id, kind: "Konseling", title: c.title, date: c.sessionDate, studentName: c.student.user.name, className: c.student.class?.name ?? "-" })),
    ...requests.filter((r) => r.preferredDate).map((r) => ({ id: r.id, kind: "Permohonan", title: r.topic, date: r.preferredDate as Date, studentName: r.student.user.name, className: r.student.class?.name ?? "-" })),
    ...summons.filter((s) => s.meetingDate).map((s) => ({ id: s.id, kind: "Pemanggilan", title: `${s.level} — ${s.reason}`, date: s.meetingDate as Date, studentName: s.student.user.name, className: s.student.class?.name ?? "-" })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return items;
}
