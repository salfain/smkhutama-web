import type { NextRequest } from "next/server";
import { apiOk, badRequest, forbidden, handle, notFound, optionalString, preflight, readJson, requiredString } from "@/server/http";
import { requireStudent } from "@/server/auth";
import { notifyRole } from "@/lib/notifications";
import * as profile from "@/server/modules/bk/profile";

/** GET /api/v1/bk/student/profile - biodata siswa beserta status verifikasinya. */
export async function GET(req: NextRequest) {
  return handle(async () => {
    const { student } = await requireStudent(req);
    const record = await profile.getProfile(student.id);
    if (!record) throw notFound("Data siswa tidak ditemukan");
    return apiOk(profile.toProfileDto(record));
  });
}

/**
 * PUT /api/v1/bk/student/profile - kirim biodata untuk diverifikasi guru BK.
 * Foto tidak lewat sini; unggahannya memakai form multipart di web.
 */
export async function PUT(req: NextRequest) {
  return handle(async () => {
    const { student } = await requireStudent(req);
    const record = await profile.getProfile(student.id);
    if (!record) throw notFound("Data siswa tidak ditemukan");
    if (record.profileStatus === "VERIFIED") {
      throw forbidden("Biodata sudah diverifikasi BK. Hubungi guru BK untuk mengubahnya.", "PROFILE_LOCKED");
    }

    const body = await readJson(req);
    const input: profile.ProfileInput = {
      birthPlace: requiredString(body, "birthPlace"),
      birthDate: requiredString(body, "birthDate"),
      address: requiredString(body, "address"),
      parentPhone: requiredString(body, "parentPhone"),
      medicalHistory: optionalString(body, "medicalHistory") ?? "",
    };
    const invalid = profile.validateProfile(input);
    if (invalid) throw badRequest(invalid, "VALIDATION_ERROR");

    await profile.submitProfile(student.id, input);
    await notifyRole("COUNSELOR", {
      type: "INFO",
      title: "Biodata siswa perlu diverifikasi",
      message: `${record.user.name} (${record.class?.name ?? "tanpa kelas"}) mengirim biodata untuk diverifikasi.`,
      href: `/counselor/students/${student.id}`,
    });

    const updated = await profile.getProfile(student.id);
    return apiOk(profile.toProfileDto(updated!));
  });
}

export async function OPTIONS() {
  return preflight();
}
