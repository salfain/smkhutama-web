import type { SensitiveAccessAction } from "@/generated/prisma/client";
import { headers } from "next/headers";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

type SensitiveAccessInput = {
  userId: string;
  action?: SensitiveAccessAction;
  resourceType: string;
  resourceId?: string | null;
  purpose?: string | null;
};

export async function logSensitiveAccess(input: SensitiveAccessInput) {
  try {
    const requestHeaders = await headers();
    const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ipAddress = forwarded || requestHeaders.get("x-real-ip") || requestHeaders.get("cf-connecting-ip") || null;
    const userAgent = requestHeaders.get("user-agent")?.slice(0, 500) ?? null;
    const action = input.action ?? "VIEW";

    await prisma.sensitiveAccessLog.create({
      data: {
        userId: input.userId,
        action,
        resourceType: input.resourceType,
        resourceId: input.resourceId || null,
        purpose: input.purpose?.slice(0, 500) || null,
        ipAddress,
        userAgent,
      },
    });

    await logAudit({
      userId: input.userId,
      action: `SENSITIVE_${action}`,
      entity: input.resourceType,
      entityId: input.resourceId,
      details: { purpose: input.purpose ?? null },
      ipAddress,
    });
  } catch {
    // Audit baca tidak boleh menggagalkan layanan utama.
  }
}
