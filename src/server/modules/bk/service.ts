/**
 * Modul BK — lapisan service inti.
 *
 * Berisi query dan aturan bisnis untuk siswa binaan, sesi konseling, catatan
 * pelanggaran, prestasi, dan permohonan konseling. Angket ada di `surveys.ts`,
 * sedangkan kunjungan rumah, pemanggilan orang tua, agenda, dan rekap ada di
 * `follow-up.ts`.
 *
 * Dipakai bersama oleh:
 *   - route API v1  : `src/app/api/v1/bk/**`
 *   - route API lama: `src/app/api/counselor/**`, `src/app/api/student/bk/**`
 *   - server action : `src/app/counselor/*.ts`, `src/app/student/bk/*.ts`
 *
 * Fungsi di sini mengembalikan record Prisma apa adanya; pemetaan ke bentuk
 * JSON API ada di `dto.ts`, sementara halaman web memetakan sesuai
 * kebutuhannya sendiri.
 */

import { prisma } from "@/lib/prisma";

export type CounselingType = "PRIBADI" | "SOSIAL" | "BELAJAR" | "KARIR";
export type CounselingStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "REFERRED";
export type RequestStatus = "PENDING" | "APPROVED" | "SCHEDULED" | "DONE" | "REJECTED";
export type ViolationCategory = "RINGAN" | "SEDANG" | "BERAT";

export const COUNSELING_TYPES: CounselingType[] = ["PRIBADI", "SOSIAL", "BELAJAR", "KARIR"];
export const COUNSELING_STATUSES: CounselingStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "REFERRED"];
export const REQUEST_STATUSES: RequestStatus[] = [
  "PENDING",
  "APPROVED",
  "SCHEDULED",
  "DONE",
  "REJECTED",
];

// ─── Bentuk include yang dipakai ulang ──────────────────────────────────────

const STUDENT_WITH_CLASS = {
  user: { select: { name: true } },
  class: { select: { name: true } },
} as const;

const POINT_COLUMNS = {
  violationRecords: { select: { points: true } },
  achievementRecords: { select: { points: true } },
  counselingCases: { select: { id: true } },
} as const;

// ─── Identitas guru BK ──────────────────────────────────────────────────────

/**
 * ID record Counselor milik user yang login, dibuat otomatis bila belum ada.
 * Akun ADMIN yang membuka menu BK pun mendapat record-nya sendiri.
 */
export async function ensureCounselorId(userId: string): Promise<string> {
  const counselor = await prisma.counselor.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  });
  return counselor.id;
}

// ─── Siswa ──────────────────────────────────────────────────────────────────

export async function listStudents() {
  return prisma.student.findMany({
    include: STUDENT_WITH_CLASS,
    orderBy: { user: { name: "asc" } },
  });
}

/** Daftar siswa lengkap dengan akumulasi poin — dipakai "buku siswa". */
export async function listStudentsWithPoints() {
  return prisma.student.findMany({
    include: { ...STUDENT_WITH_CLASS, ...POINT_COLUMNS },
    orderBy: { user: { name: "asc" } },
  });
}

/**
 * Buku siswa: seluruh riwayat BK satu siswa, ditambah data piket
 * (keterlambatan & izin) yang dibaca read-only lintas modul.
 */
export async function getStudentBook(studentId: string) {
  return prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { name: true, email: true } },
      class: { select: { name: true } },
      major: { select: { name: true } },
      violationRecords: {
        orderBy: { date: "desc" },
        include: { violationType: { select: { name: true } } },
      },
      achievementRecords: { orderBy: { date: "desc" } },
      counselingCases: { orderBy: { sessionDate: "desc" } },
      homeVisits: { orderBy: { visitDate: "desc" } },
      parentSummons: { orderBy: { createdAt: "desc" } },
      // Data milik modul piket, hanya dibaca.
      tardinessRecords: { orderBy: { date: "desc" }, take: 30 },
      permits: { orderBy: { date: "desc" }, take: 30 },
    },
  });
}

/** Ringkasan BK milik siswa sendiri (dipakai halaman & API siswa). */
export async function getStudentBkSummary(studentId: string) {
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

  return { violations, achievements, cases, requests };
}

export function sumPoints(rows: { points: number }[]) {
  return rows.reduce((total, row) => total + row.points, 0);
}

/** Kelas yang diwalikan seorang guru, beserta rekap poin BK tiap siswanya. */
export async function getHomeroomClasses(teacherId: string) {
  return prisma.class.findMany({
    where: { homeroomTeacherId: teacherId },
    include: {
      students: {
        include: { user: { select: { name: true } }, ...POINT_COLUMNS },
        orderBy: { user: { name: "asc" } },
      },
    },
    orderBy: { name: "asc" },
  });
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export async function getCounselorDashboard() {
  const [openCases, totalCases, totalViolations, totalAchievements, pendingRequests, recentCases] =
    await Promise.all([
      prisma.counselingCase.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.counselingCase.count(),
      prisma.violationRecord.count(),
      prisma.achievementRecord.count(),
      prisma.counselingRequest.count({ where: { status: "PENDING" } }),
      prisma.counselingCase.findMany({
        take: 5,
        orderBy: { sessionDate: "desc" },
        include: { student: { include: STUDENT_WITH_CLASS } },
      }),
    ]);

  return { openCases, totalCases, totalViolations, totalAchievements, pendingRequests, recentCases };
}

/** Siswa dengan poin pelanggaran tertinggi, urut menurun. */
export async function getTopViolationStudents(take = 5) {
  const grouped = await prisma.violationRecord.groupBy({
    by: ["studentId"],
    _sum: { points: true },
    orderBy: { _sum: { points: "desc" } },
    take,
  });
  if (grouped.length === 0) return [];

  const students = await prisma.student.findMany({
    where: { id: { in: grouped.map((row) => row.studentId) } },
    include: STUDENT_WITH_CLASS,
  });
  const byId = new Map(students.map((student) => [student.id, student]));

  // Urutan hasil groupBy yang menentukan peringkat, bukan urutan findMany.
  return grouped.map((row) => {
    const student = byId.get(row.studentId);
    return {
      name: student?.user.name ?? "?",
      className: student?.class?.name ?? "-",
      points: row._sum.points ?? 0,
    };
  });
}

// ─── Sesi konseling ─────────────────────────────────────────────────────────

export async function listCases() {
  return prisma.counselingCase.findMany({
    orderBy: { sessionDate: "desc" },
    include: { student: { include: STUDENT_WITH_CLASS } },
  });
}

export async function getCase(id: string) {
  return prisma.counselingCase.findUnique({
    where: { id },
    include: {
      // `major` hanya dipakai halaman cetak; biayanya satu join pada satu record.
      student: { include: { ...STUDENT_WITH_CLASS, major: { select: { name: true } } } },
      counselor: { include: { user: { select: { name: true } } } },
    },
  });
}

export type SaveCaseInput = {
  id?: string | null;
  studentId: string;
  counselorId: string;
  type: CounselingType;
  status: CounselingStatus;
  title: string;
  description?: string | null;
  notes?: string | null;
  followUp?: string | null;
  isConfidential: boolean;
  sessionDate?: string | Date | null;
};

export async function saveCase(input: SaveCaseInput) {
  const data = {
    type: input.type,
    status: input.status,
    title: input.title,
    description: input.description || null,
    notes: input.notes || null,
    followUp: input.followUp || null,
    isConfidential: input.isConfidential,
    sessionDate: input.sessionDate ? new Date(input.sessionDate) : new Date(),
  };

  if (input.id) {
    return prisma.counselingCase.update({ where: { id: input.id }, data });
  }
  return prisma.counselingCase.create({
    data: { ...data, studentId: input.studentId, counselorId: input.counselorId },
  });
}

/** Ubah status saja. False bila kasusnya tidak ada. */
export async function updateCaseStatus(id: string, status: CounselingStatus) {
  const result = await prisma.counselingCase.updateMany({ where: { id }, data: { status } });
  return result.count > 0;
}

export async function deleteCase(id: string) {
  const result = await prisma.counselingCase.deleteMany({ where: { id } });
  return result.count > 0;
}

// ─── Master jenis pelanggaran ───────────────────────────────────────────────

export async function listViolationTypes() {
  return prisma.violationType.findMany({ orderBy: [{ category: "asc" }, { points: "desc" }] });
}

export type SaveViolationTypeInput = {
  id?: string | null;
  name: string;
  category: ViolationCategory;
  points: number;
};

export async function saveViolationType(input: SaveViolationTypeInput) {
  const data = { name: input.name, category: input.category, points: input.points };
  if (input.id) return prisma.violationType.update({ where: { id: input.id }, data });
  return prisma.violationType.create({ data });
}

export async function deleteViolationType(id: string) {
  const result = await prisma.violationType.deleteMany({ where: { id } });
  return result.count > 0;
}

// ─── Catatan pelanggaran ────────────────────────────────────────────────────

/** `take` kosong berarti seluruh catatan. */
export async function listViolations(options: { take?: number } = {}) {
  return prisma.violationRecord.findMany({
    orderBy: { date: "desc" },
    take: options.take,
    include: {
      student: { include: STUDENT_WITH_CLASS },
      recordedBy: { select: { name: true } },
      violationType: { select: { name: true } },
    },
  });
}

export type SaveViolationInput = {
  id?: string | null;
  studentId: string;
  recordedById: string;
  violationTypeId?: string | null;
  description: string;
  points: number;
  sanction?: string | null;
  date?: string | Date | null;
};

export async function saveViolation(input: SaveViolationInput) {
  const data = {
    violationTypeId: input.violationTypeId || null,
    description: input.description,
    points: input.points,
    sanction: input.sanction || null,
    date: input.date ? new Date(input.date) : new Date(),
  };

  if (input.id) return prisma.violationRecord.update({ where: { id: input.id }, data });
  return prisma.violationRecord.create({
    data: { ...data, studentId: input.studentId, recordedById: input.recordedById },
  });
}

export async function deleteViolation(id: string) {
  const result = await prisma.violationRecord.deleteMany({ where: { id } });
  return result.count > 0;
}

// ─── Catatan prestasi ───────────────────────────────────────────────────────

export async function listAchievements(options: { take?: number } = {}) {
  return prisma.achievementRecord.findMany({
    orderBy: { date: "desc" },
    take: options.take,
    include: {
      student: { include: STUDENT_WITH_CLASS },
      recordedBy: { select: { name: true } },
    },
  });
}

export type SaveAchievementInput = {
  id?: string | null;
  studentId: string;
  recordedById: string;
  title: string;
  description?: string | null;
  points: number;
  level?: string | null;
  date?: string | Date | null;
};

export async function saveAchievement(input: SaveAchievementInput) {
  const data = {
    title: input.title,
    description: input.description || null,
    points: input.points,
    level: input.level || null,
    date: input.date ? new Date(input.date) : new Date(),
  };

  if (input.id) return prisma.achievementRecord.update({ where: { id: input.id }, data });
  return prisma.achievementRecord.create({
    data: { ...data, studentId: input.studentId, recordedById: input.recordedById },
  });
}

export async function deleteAchievement(id: string) {
  const result = await prisma.achievementRecord.deleteMany({ where: { id } });
  return result.count > 0;
}

// ─── Permohonan konseling ───────────────────────────────────────────────────

export async function listRequests() {
  return prisma.counselingRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { student: { include: STUDENT_WITH_CLASS } },
  });
}

export type CreateRequestInput = {
  studentId: string;
  topic: string;
  description?: string | null;
  urgency?: string | null;
  preferredDate?: string | null;
};

export async function createRequest(input: CreateRequestInput) {
  return prisma.counselingRequest.create({
    data: {
      studentId: input.studentId,
      topic: input.topic,
      description: input.description || null,
      urgency: input.urgency || "SEDANG",
      preferredDate: input.preferredDate ? new Date(input.preferredDate) : null,
      status: "PENDING",
    },
  });
}

/** Tanggapi permohonan. False bila permohonannya tidak ada. */
export async function respondRequest(id: string, status: RequestStatus, response?: string | null) {
  const result = await prisma.counselingRequest.updateMany({
    where: { id },
    data: { status, response: response || null },
  });
  return result.count > 0;
}

/**
 * Terima permohonan dan langsung buat sesi konseling dari isinya.
 * Keduanya dalam satu transaksi supaya tidak ada permohonan yang berubah
 * status tanpa sesi pendampingnya.
 */
export async function convertRequestToCase(id: string, counselorId: string) {
  const request = await prisma.counselingRequest.findUnique({ where: { id } });
  if (!request) return null;

  const [createdCase] = await prisma.$transaction([
    prisma.counselingCase.create({
      data: {
        studentId: request.studentId,
        counselorId,
        type: "PRIBADI",
        status: "IN_PROGRESS",
        title: request.topic,
        description: request.description || null,
        sessionDate: request.preferredDate ?? new Date(),
        isConfidential: true,
      },
    }),
    prisma.counselingRequest.update({
      where: { id },
      data: {
        status: "SCHEDULED",
        response: request.response || "Permohonan diterima. Sesi konseling telah dijadwalkan.",
      },
    }),
  ]);

  return createdCase;
}

/** Siswa membatalkan permohonannya sendiri; hanya yang masih PENDING. */
export async function cancelOwnRequest(id: string, studentId: string) {
  const request = await prisma.counselingRequest.findUnique({ where: { id } });
  if (!request || request.studentId !== studentId) return { ok: false as const, reason: "FORBIDDEN" };
  if (request.status !== "PENDING") return { ok: false as const, reason: "ALREADY_PROCESSED" };

  await prisma.counselingRequest.delete({ where: { id } });
  return { ok: true as const };
}
