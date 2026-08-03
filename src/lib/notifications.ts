import type { NotificationType, Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type NotificationInput = {
  userId: string;
  title: string;
  message: string;
  href?: string | null;
  type?: NotificationType;
};

function safeInternalHref(href?: string | null) {
  if (!href) return null;
  const normalized = href.trim();
  return normalized.startsWith("/") && !normalized.startsWith("//") ? normalized.slice(0, 500) : null;
}

export function notifyUser(input: NotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title.slice(0, 160),
      message: input.message.slice(0, 1000),
      href: safeInternalHref(input.href),
      type: input.type ?? "INFO",
    },
  });
}

export async function notifyRole(role: Role, input: Omit<NotificationInput, "userId">) {
  const users = await prisma.user.findMany({ where: { role, isActive: true }, select: { id: true } });
  if (users.length === 0) return { count: 0 };
  return prisma.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      title: input.title.slice(0, 160),
      message: input.message.slice(0, 1000),
      href: safeInternalHref(input.href),
      type: input.type ?? "INFO",
    })),
  });
}
