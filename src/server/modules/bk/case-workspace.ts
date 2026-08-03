import type {
  CasePriority,
  CounselingSessionMode,
  CounselingStatus,
  ReferralStatus,
  RiskLevel,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function getCaseWorkspace(id: string) {
  return await prisma.counselingCase.findUnique({
    where: { id },
    include: {
      academicYear: { select: { year: true, semester: true } },
      student: {
        include: {
          user: { select: { name: true } },
          class: { select: { name: true } },
          major: { select: { code: true, name: true } },
        },
      },
      counselor: { include: { user: { select: { name: true } } } },
      sessions: {
        orderBy: { sessionDate: "desc" },
        include: { counselor: { include: { user: { select: { name: true } } } } },
      },
      referrals: {
        orderBy: { referredAt: "desc" },
        include: { counselor: { include: { user: { select: { name: true } } } } },
      },
    },
  });
}

export type CaseAssessmentInput = {
  status: CounselingStatus;
  priority: CasePriority;
  riskLevel: RiskLevel;
  riskNotes?: string | null;
  nextFollowUpAt?: Date | null;
};

export async function updateCaseAssessment(id: string, input: CaseAssessmentInput) {
  return await prisma.counselingCase.update({
    where: { id },
    data: {
      status: input.status,
      priority: input.priority,
      riskLevel: input.riskLevel,
      riskNotes: input.riskNotes || null,
      nextFollowUpAt: input.nextFollowUpAt ?? null,
      resolvedAt: input.status === "RESOLVED" ? new Date() : null,
    },
  });
}

export type CreateSessionInput = {
  caseId: string;
  counselorId: string;
  sessionDate: Date;
  durationMinutes: number;
  mode: CounselingSessionMode;
  location?: string | null;
  summary: string;
  intervention?: string | null;
  outcome?: string | null;
  nextPlan?: string | null;
  nextFollowUpAt?: Date | null;
  isConfidential: boolean;
};

export async function createSession(input: CreateSessionInput) {
  const [session] = await prisma.$transaction([
    prisma.counselingSession.create({
      data: {
        caseId: input.caseId,
        counselorId: input.counselorId,
        sessionDate: input.sessionDate,
        durationMinutes: input.durationMinutes,
        mode: input.mode,
        location: input.location || null,
        summary: input.summary,
        intervention: input.intervention || null,
        outcome: input.outcome || null,
        nextPlan: input.nextPlan || null,
        isConfidential: input.isConfidential,
      },
    }),
    prisma.counselingCase.update({
      where: { id: input.caseId },
      data: {
        status: "IN_PROGRESS",
        sessionDate: input.sessionDate,
        nextFollowUpAt: input.nextFollowUpAt ?? null,
        resolvedAt: null,
      },
    }),
  ]);
  return session;
}

export async function deleteSession(id: string, caseId: string) {
  const result = await prisma.counselingSession.deleteMany({ where: { id, caseId } });
  return result.count > 0;
}

export type CreateReferralInput = {
  caseId: string;
  counselorId: string;
  referredTo: string;
  institution?: string | null;
  contact?: string | null;
  reason: string;
  referredAt: Date;
  followUpAt?: Date | null;
};

export async function createReferral(input: CreateReferralInput) {
  const [referral] = await prisma.$transaction([
    prisma.counselingReferral.create({
      data: {
        caseId: input.caseId,
        counselorId: input.counselorId,
        referredTo: input.referredTo,
        institution: input.institution || null,
        contact: input.contact || null,
        reason: input.reason,
        referredAt: input.referredAt,
        followUpAt: input.followUpAt ?? null,
      },
    }),
    prisma.counselingCase.update({
      where: { id: input.caseId },
      data: { status: "REFERRED", nextFollowUpAt: input.followUpAt ?? null, resolvedAt: null },
    }),
  ]);
  return referral;
}

export async function updateReferral(id: string, caseId: string, status: ReferralStatus, result?: string | null) {
  const referral = await prisma.counselingReferral.updateMany({
    where: { id, caseId },
    data: { status, result: result || null },
  });
  return referral.count > 0;
}

export async function deleteReferral(id: string, caseId: string) {
  const result = await prisma.counselingReferral.deleteMany({ where: { id, caseId } });
  return result.count > 0;
}

/** Kasus berisiko, prioritas tinggi, atau tindak lanjutnya sudah dekat/terlewat. */
export async function getPriorityQueue() {
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return await prisma.counselingCase.findMany({
    where: {
      status: { in: ["OPEN", "IN_PROGRESS", "REFERRED"] },
      OR: [
        { priority: { in: ["HIGH", "CRITICAL"] } },
        { riskLevel: { in: ["HIGH", "CRITICAL"] } },
        { nextFollowUpAt: { lte: nextWeek } },
      ],
    },
    orderBy: [{ riskLevel: "desc" }, { priority: "desc" }, { nextFollowUpAt: "asc" }],
    take: 8,
    include: {
      student: { include: { user: { select: { name: true } }, class: { select: { name: true } } } },
      _count: { select: { sessions: true, referrals: true } },
    },
  });
}
