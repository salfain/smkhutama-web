import { NextResponse } from "next/server";

// Untuk JWT stateless, logout cukup dilakukan di sisi client (hapus token).
// Endpoint ini disediakan agar mobile bisa memanggil & konsisten dengan kontrak API.
export async function POST() {
  return NextResponse.json({ success: true });
}
