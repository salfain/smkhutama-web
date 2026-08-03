import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, type: true, title: true, message: true, href: true, readAt: true, createdAt: true },
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  return NextResponse.json({ items, unreadCount });
}

export async function PATCH(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { id?: string; all?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  if (body.all) {
    await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  } else if (typeof body.id === "string" && body.id) {
    await prisma.notification.updateMany({ where: { id: body.id, userId: user.id, readAt: null }, data: { readAt: new Date() } });
  } else {
    return NextResponse.json({ error: "Notifikasi tidak dipilih" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
