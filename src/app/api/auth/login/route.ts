import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { createToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const { username, password, role } = await req.json();
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { username } });
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

    const token = await createToken(user.id, user.role);

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
