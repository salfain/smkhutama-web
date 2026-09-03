import type { NextRequest } from "next/server";
import { apiOk, badRequest, handle, notFound, oneOf, optionalString, preflight, readJson } from "@/server/http";
import { requireCounselorAccess } from "@/server/auth";
import { notifyUser } from "@/lib/notifications";
import * as profile from "@/server/modules/bk/profile";

/**
 * PATCH /api/v1/bk/counselor/students/profiles/{id} - verifikasi atau kembalikan
 * biodata siswa. Body: { action: "verify" | "reject", note? }.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const actor = await requireCounselorAccess(req);
    const { id } = await ctx.params;

    const record = await profile.getProfile(id);
    if (!record) throw notFound("Data siswa tidak ditemukan");

    const body = await readJson(req);
    const action = oneOf(body, "action", ["verify", "reject"] as const);

    if (action === "verify") {
      await profile.verifyProfile(id, actor.id);
      await notifyUser({
        userId: record.user.id,
        title: "Biodata terverifikasi",
        message: "Guru BK telah memverifikasi biodata Anda.",
        href: "/student/profile",
      });
    } else {
      const note = optionalString(body, "note");
      if (!note) throw badRequest("Catatan perbaikan wajib diisi", "VALIDATION_ERROR");
      await profile.rejectProfile(id, actor.id, note);
      await notifyUser({
        userId: record.user.id,
        title: "Biodata perlu diperbaiki",
        message: `Catatan guru BK: ${note}`,
        href: "/student/profile",
      });
    }

    const updated = await profile.getProfile(id);
    return apiOk(profile.toProfileDto(updated!));
  });
}

export async function OPTIONS() {
  return preflight();
}
