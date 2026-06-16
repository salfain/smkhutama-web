import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const profile = await prisma.schoolProfile.findFirst();
    if (!profile?.logo) {
      // Return default favicon jika belum ada logo
      return NextResponse.redirect(new URL("/favicon.ico", req.url));
    }

    // Logo disimpan di public/uploads/school/logo.xxx
    const filePath = path.join(process.cwd(), "public", profile.logo);
    const buffer = await readFile(filePath);

    const ext = profile.logo.split(".").pop()?.toLowerCase() ?? "png";
    const contentType =
      ext === "png" ? "image/png" :
      ext === "webp" ? "image/webp" :
      ext === "ico" ? "image/x-icon" :
      "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.redirect(new URL("/favicon.ico", req.url));
  }
}
