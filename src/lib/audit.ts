import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";

const COOKIE_NAME = "cbt-session";

type AuditDetails =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[];

type AuditInput = {
  action: string;
  entity?: string;
  entityId?: string | null;
  details?: AuditDetails;
  userId?: string | null;
  ipAddress?: string | null;
};

function stringifyDetails(details: AuditDetails | undefined): string | null {
  if (details === undefined || details === null) return null;
  if (typeof details === "string") return details.slice(0, 4000);
  try {
    return JSON.stringify(details).slice(0, 4000);
  } catch {
    return String(details).slice(0, 4000);
  }
}

async function getRequestIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || h.get("cf-connecting-ip") || null;
}

export async function logAudit(input: AuditInput) {
  try {
    const c = await cookies();
    const userId = input.userId ?? c.get(COOKIE_NAME)?.value ?? null;
    const ipAddress = input.ipAddress ?? (await getRequestIp());

    await prisma.auditLog.create({
      data: {
        userId,
        action: input.action,
        entity: input.entity ?? null,
        entityId: input.entityId ?? null,
        details: stringifyDetails(input.details),
        ipAddress,
      },
    });

    revalidatePath("/admin/audit-logs");
  } catch {
    // Audit log tidak boleh menggagalkan aksi utama.
  }
}
