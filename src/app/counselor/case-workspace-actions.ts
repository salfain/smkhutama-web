"use server";

import type {
  CasePriority,
  CounselingSessionMode,
  CounselingStatus,
  ReferralStatus,
  RiskLevel,
} from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { notifyUser } from "@/lib/notifications";
import { requirePermission } from "@/lib/permissions";
import { logSensitiveAccess } from "@/lib/sensitive-access";
import { requireCounselorAuth } from "@/lib/session";
import { ensureCounselorId } from "@/server/modules/bk/service";
import * as workspace from "@/server/modules/bk/case-workspace";

function text(data: FormData, key: string) {
  return String(data.get(key) ?? "").trim();
}

function optionalDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function paths(caseId: string) {
  revalidatePath(`/counselor/cases/${caseId}`);
  revalidatePath("/counselor/cases");
  revalidatePath("/counselor/dashboard");
  revalidatePath("/counselor/agenda");
}

export async function getCaseWorkspace(id: string) {
  await requireCounselorAuth();
  const user = await requirePermission("bk.sensitive.view");
  const record = await workspace.getCaseWorkspace(id);
  if (!record) return null;
  await logSensitiveAccess({ userId: user.id, resourceType: "counseling_case_workspace", resourceId: id, purpose: "Membuka ruang kerja kasus BK" });
  return record;
}

export async function saveCaseAssessment(caseId: string, data: FormData) {
  const user = await requireCounselorAuth();
  await requirePermission("bk.sensitive.view");
  const allowedStatus = ["OPEN", "IN_PROGRESS", "RESOLVED", "REFERRED"];
  const allowedPriority = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const allowedRisk = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const status = text(data, "status");
  const priority = text(data, "priority");
  const riskLevel = text(data, "riskLevel");
  if (!allowedStatus.includes(status) || !allowedPriority.includes(priority) || !allowedRisk.includes(riskLevel)) return { error: "Nilai asesmen tidak valid." };
  if (["HIGH", "CRITICAL"].includes(riskLevel) && !text(data, "riskNotes")) return { error: "Catatan risiko wajib diisi untuk tingkat risiko tinggi atau kritis." };

  await workspace.updateCaseAssessment(caseId, {
    status: status as CounselingStatus,
    priority: priority as CasePriority,
    riskLevel: riskLevel as RiskLevel,
    riskNotes: text(data, "riskNotes"),
    nextFollowUpAt: optionalDate(text(data, "nextFollowUpAt")),
  });
  await logAudit({ userId: user.id, action: "UPDATE_BK_CASE_ASSESSMENT", entity: "counseling_case", entityId: caseId, details: { status, priority, riskLevel } });
  paths(caseId);
  return { success: true };
}

export async function addCounselingSession(caseId: string, data: FormData) {
  const user = await requireCounselorAuth();
  await requirePermission("bk.sensitive.view");
  const summary = text(data, "summary");
  const mode = text(data, "mode") || "INDIVIDUAL";
  if (!summary) return { error: "Ringkasan pertemuan wajib diisi." };
  if (!["INDIVIDUAL", "GROUP", "PARENT", "TEACHER", "ONLINE"].includes(mode)) return { error: "Metode pertemuan tidak valid." };
  const duration = Math.min(480, Math.max(5, Number.parseInt(text(data, "durationMinutes"), 10) || 45));
  const counselorId = await ensureCounselorId(user.id);
  const nextFollowUpAt = optionalDate(text(data, "nextFollowUpAt"));
  const record = await workspace.createSession({
    caseId,
    counselorId,
    sessionDate: optionalDate(text(data, "sessionDate")) ?? new Date(),
    durationMinutes: duration,
    mode: mode as CounselingSessionMode,
    location: text(data, "location"),
    summary,
    intervention: text(data, "intervention"),
    outcome: text(data, "outcome"),
    nextPlan: text(data, "nextPlan"),
    nextFollowUpAt,
    isConfidential: data.get("isConfidential") === "on",
  });

  if (nextFollowUpAt) {
    const caseRecord = await workspace.getCaseWorkspace(caseId);
    if (caseRecord) await notifyUser({ userId: caseRecord.student.userId, type: "INFO", title: "Jadwal tindak lanjut BK", message: "Tindak lanjut layanan BK Anda telah dijadwalkan. Silakan periksa agenda atau hubungi Guru BK.", href: "/student/bk" });
  }
  await logAudit({ userId: user.id, action: "CREATE_COUNSELING_SESSION", entity: "counseling_session", entityId: record.id, details: { caseId, mode, durationMinutes: duration } });
  paths(caseId);
  return { success: true };
}

export async function removeCounselingSession(caseId: string, id: string) {
  const user = await requireCounselorAuth();
  await requirePermission("bk.sensitive.view");
  await workspace.deleteSession(id, caseId);
  await logAudit({ userId: user.id, action: "DELETE_COUNSELING_SESSION", entity: "counseling_session", entityId: id, details: { caseId } });
  paths(caseId);
  return { success: true };
}

export async function addCaseReferral(caseId: string, data: FormData) {
  const user = await requireCounselorAuth();
  await requirePermission("bk.sensitive.view");
  const referredTo = text(data, "referredTo");
  const reason = text(data, "reason");
  if (!referredTo || !reason) return { error: "Tujuan dan alasan rujukan wajib diisi." };
  const counselorId = await ensureCounselorId(user.id);
  const record = await workspace.createReferral({
    caseId,
    counselorId,
    referredTo,
    institution: text(data, "institution"),
    contact: text(data, "contact"),
    reason,
    referredAt: optionalDate(text(data, "referredAt")) ?? new Date(),
    followUpAt: optionalDate(text(data, "followUpAt")),
  });
  await logAudit({ userId: user.id, action: "CREATE_BK_REFERRAL", entity: "counseling_referral", entityId: record.id, details: { caseId, referredTo } });
  paths(caseId);
  return { success: true };
}

export async function changeReferralStatus(caseId: string, id: string, status: ReferralStatus, result: string) {
  const user = await requireCounselorAuth();
  await requirePermission("bk.sensitive.view");
  if (!["PLANNED", "SENT", "ACCEPTED", "COMPLETED", "CANCELLED"].includes(status)) return { error: "Status rujukan tidak valid." };
  await workspace.updateReferral(id, caseId, status, result);
  await logAudit({ userId: user.id, action: "UPDATE_BK_REFERRAL", entity: "counseling_referral", entityId: id, details: { caseId, status } });
  paths(caseId);
  return { success: true };
}

export async function removeCaseReferral(caseId: string, id: string) {
  const user = await requireCounselorAuth();
  await requirePermission("bk.sensitive.view");
  await workspace.deleteReferral(id, caseId);
  await logAudit({ userId: user.id, action: "DELETE_BK_REFERRAL", entity: "counseling_referral", entityId: id, details: { caseId } });
  paths(caseId);
  return { success: true };
}

export async function getBkPriorityQueue() {
  await requireCounselorAuth();
  await requirePermission("bk.sensitive.view");
  return workspace.getPriorityQueue();
}
