/**
 * Modul CBT — pesan dan status HTTP untuk kode kegagalan sesi ujian.
 *
 * Dipisah dari service supaya service tetap bebas dari urusan HTTP: service
 * mengembalikan kode, lapisan ini yang menentukan kalimat dan status-nya.
 * Route v1 memakai helper `ApiError`; route lama memakai peta pesan yang sama
 * agar teks yang sudah dikenal pengguna tidak berubah.
 */

import { ApiError, badRequest, forbidden, notFound } from "@/server/http";
import type { ExamAccessCode, TokenCode } from "./exam-session";

export const EXAM_ACCESS_MESSAGES: Record<ExamAccessCode, string> = {
  EXAM_NOT_FOUND: "Ujian tidak ditemukan",
  EXAM_NOT_ACTIVE: "Ujian belum aktif",
  EXAM_NOT_STARTED: "Ujian belum dimulai",
  EXAM_ENDED: "Ujian sudah berakhir",
  NOT_PARTICIPANT: "Anda bukan peserta ujian ini",
};

export const EXAM_ACCESS_STATUS: Record<ExamAccessCode, number> = {
  EXAM_NOT_FOUND: 404,
  EXAM_NOT_ACTIVE: 400,
  EXAM_NOT_STARTED: 400,
  EXAM_ENDED: 400,
  NOT_PARTICIPANT: 403,
};

export const EXAM_TOKEN_MESSAGES: Record<TokenCode, string> = {
  TOKEN_REQUIRED: "Token wajib untuk memulai ujian",
  TOKEN_INVALID: "Token tidak valid",
  TOKEN_EXPIRED: "Token kadaluarsa",
};

export function examAccessError(code: ExamAccessCode): ApiError {
  const message = EXAM_ACCESS_MESSAGES[code];
  if (code === "EXAM_NOT_FOUND") return notFound(message, code);
  if (code === "NOT_PARTICIPANT") return forbidden(message, code);
  return badRequest(message, code);
}

export function examTokenError(code: TokenCode): ApiError {
  return badRequest(EXAM_TOKEN_MESSAGES[code], code);
}

export const attemptNotFound = () => notFound("Attempt tidak ditemukan", "ATTEMPT_NOT_FOUND");

export const alreadySubmitted = () =>
  new ApiError(409, "ALREADY_SUBMITTED", "Ujian sudah dikerjakan");

export const attemptLocked = (lockReason: string | null) =>
  new ApiError(423, "ATTEMPT_LOCKED", lockReason ?? "Ujian terkunci");
