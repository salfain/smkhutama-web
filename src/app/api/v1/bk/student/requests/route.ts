import type { NextRequest } from "next/server";
import { apiOk, handle, optionalString, preflight, readJson, requiredString } from "@/server/http";
import { requireStudent } from "@/server/auth";
import { createRequest } from "@/server/modules/bk/service";

/** POST /api/v1/bk/student/requests - ajukan permohonan konseling. */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const { student } = await requireStudent(req);
    const body = await readJson(req);

    const record = await createRequest({
      studentId: student.id,
      topic: requiredString(body, "topic"),
      description: optionalString(body, "description"),
      urgency: optionalString(body, "urgency"),
      preferredDate: optionalString(body, "preferredDate"),
    });

    return apiOk({ id: record.id, status: record.status }, 201);
  });
}

export async function OPTIONS() {
  return preflight();
}
