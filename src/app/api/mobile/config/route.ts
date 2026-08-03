import { NextResponse } from "next/server";
import { getClientConfig } from "@/server/modules/shared/config";

// Endpoint versi lama. Penggantinya: GET /api/v1/config.
export async function GET() {
  return NextResponse.json(await getClientConfig());
}
