import { NextRequest, NextResponse } from "next/server";
import { readMediaObject } from "@/server/modules/shared/assets";

export const dynamic = "force-dynamic";

// Endpoint versi lama — dipakai `src/lib/r2.ts` untuk membangun URL publik.
// Penggantinya: GET /api/v1/media/{key}.
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });

  try {
    const result = await readMediaObject(key);

    if (result.state === "NOT_CONFIGURED") {
      return NextResponse.json({ error: "Cloudflare R2 is not configured" }, { status: 500 });
    }
    if (result.state === "NOT_FOUND") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const headers = new Headers();
    if (result.contentType) headers.set("Content-Type", result.contentType);
    if (result.contentLength) headers.set("Content-Length", String(result.contentLength));
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(result.body, { headers });
  } catch {
    return NextResponse.json({ error: "Failed to fetch file from R2" }, { status: 500 });
  }
}
