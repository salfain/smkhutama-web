import type { NextRequest } from "next/server";
import { apiOk, handle, optionalString, preflight, readJson, requiredString } from "@/server/http";
import { submitRegistration } from "@/server/modules/landing/ppdb";

/**
 * POST /api/v1/landing/ppdb - kirim pendaftaran siswa baru. Publik.
 *
 * Yang dikembalikan hanya nomor pendaftaran; nomor itulah yang dipakai calon
 * siswa untuk mengecek statusnya nanti.
 */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const body = await readJson(req);

    const registration = await submitRegistration({
      fullName: requiredString(body, "fullName"),
      phone: requiredString(body, "phone"),
      selectedMajor: requiredString(body, "selectedMajor"),
      nisn: optionalString(body, "nisn"),
      gender: optionalString(body, "gender"),
      birthPlace: optionalString(body, "birthPlace"),
      birthDate: optionalString(body, "birthDate"),
      address: optionalString(body, "address"),
      email: optionalString(body, "email"),
      parentName: optionalString(body, "parentName"),
      parentPhone: optionalString(body, "parentPhone"),
      originSchool: optionalString(body, "originSchool"),
    });

    return apiOk({ registNumber: registration.registNumber, status: registration.status }, 201);
  });
}

export async function OPTIONS() {
  return preflight();
}
