import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { createToken } from "@/lib/jwt";
import { logAudit } from "@/lib/audit";
import { getJakartaDayOfWeek, getPiketDayName, isTeacherScheduledForPiket } from "@/lib/piket-schedule";

export async function POST(req: NextRequest) {
  try {
    const { username, password, role, system } = await req.json();
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { teacher: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Akun nonaktif. Hubungi admin." },
        { status: 403 }
      );
    }
    if (role && user.role !== role) {
      return NextResponse.json(
        { error: `Akun ini bukan akun ${role.toLowerCase()}` },
        { status: 403 }
      );
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    if (system === "PIKET") {
      if (user.role !== "TEACHER" || !user.teacher) {
        return NextResponse.json(
          { error: "Login piket menggunakan akun guru" },
          { status: 403 }
        );
      }

      const scheduled = await isTeacherScheduledForPiket(user.teacher.id);
      if (!scheduled) {
        const today = getPiketDayName(getJakartaDayOfWeek());
        return NextResponse.json(
          { error: `Anda tidak terjadwal piket hari ${today}. Hubungi admin jika jadwal belum diatur.` },
          { status: 403 }
        );
      }
    }

    const token = await createToken(user.id, user.role);
    await logAudit({
      userId: user.id,
      action: "API_LOGIN_SUCCESS",
      entity: "auth",
      entityId: user.id,
      details: { username: user.username, role: user.role },
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
