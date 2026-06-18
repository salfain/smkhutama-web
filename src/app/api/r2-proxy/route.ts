import { NextRequest, NextResponse } from "next/server";
import { s3 } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
  }

  if (!s3) {
    return NextResponse.json({ error: "Cloudflare R2 is not configured" }, { status: 500 });
  }

  try {
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      })
    );

    if (!response.Body) {
      return NextResponse.json({ error: "File empty or not found" }, { status: 404 });
    }

    // Mengubah body stream S3 ke readable stream Next.js
    const headers = new Headers();
    if (response.ContentType) {
      headers.set("Content-Type", response.ContentType);
    }
    if (response.ContentLength) {
      headers.set("Content-Length", response.ContentLength.toString());
    }
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    // Body stream casting ke ReadableStream
    return new NextResponse(response.Body as ReadableStream, { headers });
  } catch (error: any) {
    console.error("R2 Proxy Error:", error);
    if (error.name === "NoSuchKey") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to fetch file from R2" }, { status: 500 });
  }
}
