/**
 * Modul BK — pemetaan record Prisma ke bentuk JSON API.
 *
 * Bentuk di sini sengaja sama persis dengan response route lama
 * (`/api/counselor/**`, `/api/student/bk/**`, `/api/student/surveys/**`)
 * supaya klien yang sudah ada tidak perlu berubah saat pindah ke `/api/v1`.
 */

import type {
  getCounselorDashboard,
  getCase,
  getStudentBkSummary,
  getStudentBook,
  listAchievements,
  listCases,
  listRequests,
  listStudents,
  listStudentsWithPoints,
  listViolations,
} from "./service";
import { sumPoints } from "./service";
import type {
  getSurvey,
  getSurveyForStudent,
  listSurveys,
  listSurveysForStudent,
} from "./surveys";

type StudentOption = Awaited<ReturnType<typeof listStudents>>[number];
type StudentWithPoints = Awaited<ReturnType<typeof listStudentsWithPoints>>[number];
type StudentBook = NonNullable<Awaited<ReturnType<typeof getStudentBook>>>;
type StudentSummary = Awaited<ReturnType<typeof getStudentBkSummary>>;
type Dashboard = Awaited<ReturnType<typeof getCounselorDashboard>>;
type CaseListItem = Awaited<ReturnType<typeof listCases>>[number];
type CaseDetail = NonNullable<Awaited<ReturnType<typeof getCase>>>;
type ViolationRecord = Awaited<ReturnType<typeof listViolations>>[number];
type AchievementRecord = Awaited<ReturnType<typeof listAchievements>>[number];
type CounselingRequest = Awaited<ReturnType<typeof listRequests>>[number];
type SurveyListItem = Awaited<ReturnType<typeof listSurveys>>[number];
type SurveyDetail = NonNullable<Awaited<ReturnType<typeof getSurvey>>>;
type StudentSurveyListItem = Awaited<ReturnType<typeof listSurveysForStudent>>[number];
type StudentSurveyDetail = NonNullable<Awaited<ReturnType<typeof getSurveyForStudent>>>;

const NO_CLASS = "-";

// ─── Siswa ──────────────────────────────────────────────────────────────────

export function toStudentOption(student: StudentOption) {
  return {
    id: student.id,
    name: student.user.name,
    nis: student.nis ?? "",
    className: student.class?.name ?? NO_CLASS,
  };
}

export function toStudentWithPoints(student: StudentWithPoints) {
  return {
    id: student.id,
    name: student.user.name,
    nis: student.nis ?? "",
    className: student.class?.name ?? NO_CLASS,
    violationPoints: sumPoints(student.violationRecords),
    achievementPoints: sumPoints(student.achievementRecords),
    cases: student.counselingCases.length,
  };
}

export function toStudentBook(student: StudentBook) {
  const violationPoints = sumPoints(student.violationRecords);
  const achievementPoints = sumPoints(student.achievementRecords);

  return {
    id: student.id,
    name: student.user.name,
    nis: student.nis ?? "",
    nisn: student.nisn ?? "",
    className: student.class?.name ?? NO_CLASS,
    major: student.major?.name ?? NO_CLASS,
    gender: student.gender,
    violationPoints,
    achievementPoints,
    netPoints: achievementPoints - violationPoints,
    violations: student.violationRecords.map((v) => ({
      id: v.id,
      typeName: v.violationType?.name ?? null,
      description: v.description,
      points: v.points,
      sanction: v.sanction ?? "",
      date: v.date,
    })),
    achievements: student.achievementRecords.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description ?? "",
      points: a.points,
      level: a.level ?? "",
      date: a.date,
    })),
    cases: student.counselingCases.map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      status: c.status,
      sessionDate: c.sessionDate,
    })),
    homeVisits: student.homeVisits.map((h) => ({
      id: h.id,
      purpose: h.purpose,
      visitDate: h.visitDate,
      result: h.result ?? "",
    })),
    summons: student.parentSummons.map((s) => ({
      id: s.id,
      level: s.level,
      reason: s.reason,
      status: s.status,
      createdAt: s.createdAt,
    })),
    // Data modul piket, hanya dibaca.
    tardiness: student.tardinessRecords.map((t) => ({
      id: t.id,
      arrivalTime: t.arrivalTime,
      reason: t.reason ?? "",
      sanction: t.sanction ?? "",
      date: t.date,
    })),
    permits: student.permits.map((p) => ({
      id: p.id,
      reason: p.reason,
      exitTime: p.exitTime,
      returnTime: p.returnTime,
      status: p.status,
      date: p.date,
    })),
  };
}

/**
 * Ringkasan BK milik siswa sendiri. Deskripsi sesi yang ditandai rahasia
 * disembunyikan — siswa tetap melihat sesinya ada, bukan isinya.
 */
export function toStudentSummary(summary: StudentSummary) {
  const violationPoints = sumPoints(summary.violations);
  const achievementPoints = sumPoints(summary.achievements);

  return {
    violationPoints,
    achievementPoints,
    netPoints: achievementPoints - violationPoints,
    violations: summary.violations.map((v) => ({
      id: v.id,
      typeName: v.violationType?.name ?? null,
      description: v.description,
      points: v.points,
      sanction: v.sanction ?? "",
      date: v.date,
    })),
    achievements: summary.achievements.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description ?? "",
      points: a.points,
      level: a.level ?? "",
      date: a.date,
    })),
    cases: summary.cases.map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      status: c.status,
      description: c.isConfidential ? null : (c.description ?? ""),
      isConfidential: c.isConfidential,
      sessionDate: c.sessionDate,
    })),
    requests: summary.requests.map(toOwnRequest),
  };
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export function toDashboard(dashboard: Dashboard) {
  return {
    openCases: dashboard.openCases,
    totalCases: dashboard.totalCases,
    totalViolations: dashboard.totalViolations,
    totalAchievements: dashboard.totalAchievements,
    pendingRequests: dashboard.pendingRequests,
    recentCases: dashboard.recentCases.map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      status: c.status,
      studentName: c.student.user.name,
      className: c.student.class?.name ?? NO_CLASS,
      sessionDate: c.sessionDate,
    })),
  };
}

// ─── Sesi konseling ─────────────────────────────────────────────────────────

export function toCase(record: CaseListItem) {
  return {
    id: record.id,
    studentName: record.student.user.name,
    className: record.student.class?.name ?? NO_CLASS,
    type: record.type,
    status: record.status,
    title: record.title,
    description: record.description ?? "",
    notes: record.notes ?? "",
    followUp: record.followUp ?? "",
    isConfidential: record.isConfidential,
    sessionDate: record.sessionDate,
  };
}

export function toCaseDetail(record: CaseDetail) {
  return {
    id: record.id,
    studentId: record.studentId,
    studentName: record.student.user.name,
    className: record.student.class?.name ?? NO_CLASS,
    counselorName: record.counselor.user.name,
    type: record.type,
    status: record.status,
    title: record.title,
    description: record.description ?? "",
    notes: record.notes ?? "",
    followUp: record.followUp ?? "",
    isConfidential: record.isConfidential,
    sessionDate: record.sessionDate,
    // Riwayat pertemuan per sesi belum dimodelkan; field ini dipertahankan
    // supaya klien lama tidak perlu berubah.
    sessions: [] as never[],
  };
}

// ─── Pelanggaran & prestasi ─────────────────────────────────────────────────

export function toViolation(record: ViolationRecord) {
  return {
    id: record.id,
    studentName: record.student.user.name,
    className: record.student.class?.name ?? NO_CLASS,
    recordedByName: record.recordedBy.name,
    typeName: record.violationType?.name ?? null,
    description: record.description,
    points: record.points,
    sanction: record.sanction ?? "",
    date: record.date,
  };
}

export function toAchievement(record: AchievementRecord) {
  return {
    id: record.id,
    studentName: record.student.user.name,
    className: record.student.class?.name ?? NO_CLASS,
    recordedByName: record.recordedBy.name,
    title: record.title,
    description: record.description ?? "",
    points: record.points,
    level: record.level ?? "",
    date: record.date,
  };
}

// ─── Permohonan konseling ───────────────────────────────────────────────────

export function toRequest(record: CounselingRequest) {
  return {
    ...toOwnRequest(record),
    studentName: record.student.user.name,
    className: record.student.class?.name ?? NO_CLASS,
  };
}

/** Bentuk permohonan tanpa identitas siswa — dipakai di ringkasan siswa. */
function toOwnRequest(record: {
  id: string;
  topic: string;
  description: string | null;
  urgency: string;
  status: string;
  response: string | null;
  preferredDate: Date | null;
  createdAt: Date;
}) {
  return {
    id: record.id,
    topic: record.topic,
    description: record.description ?? "",
    urgency: record.urgency,
    status: record.status,
    response: record.response ?? "",
    preferredDate: record.preferredDate,
    createdAt: record.createdAt,
  };
}

// ─── Angket ─────────────────────────────────────────────────────────────────

export function toSurvey(survey: SurveyListItem) {
  return {
    id: survey.id,
    title: survey.title,
    description: survey.description,
    isActive: survey.isActive,
    questionCount: survey._count.questions,
    responseCount: survey._count.responses,
    createdAt: survey.createdAt,
  };
}

export function toSurveyDetail(survey: SurveyDetail) {
  return {
    id: survey.id,
    title: survey.title,
    description: survey.description,
    isActive: survey.isActive,
    questions: survey.questions.map((q) => ({
      id: q.id,
      text: q.text,
      category: q.category,
      orderNumber: q.orderNumber,
    })),
  };
}

export function toStudentSurvey(survey: StudentSurveyListItem) {
  return {
    id: survey.id,
    title: survey.title,
    description: survey.description,
    questionCount: survey._count.questions,
    answered: survey.responses.length > 0,
  };
}

export function toStudentSurveyDetail(survey: StudentSurveyDetail) {
  return {
    id: survey.id,
    title: survey.title,
    description: survey.description,
    answered: survey.responses.length > 0,
    questions: survey.questions.map((q) => ({
      id: q.id,
      text: q.text,
      category: q.category,
      orderNumber: q.orderNumber,
    })),
  };
}
