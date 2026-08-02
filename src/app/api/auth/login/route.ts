import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/server/http";
import { login } from "@/server/modules/auth/service";

// Endpoint versi lama. Penggantinya: POST /api/v1/auth/login.
// Pesan dan status kegagalannya sama karena `login()` melempar `ApiError`
// yang sudah membawa keduanya.
export async function POST(req: NextRequest) {
  try {
    const { username, password, role, system } = await req.json();
    const result = await login({ username, password, role, system });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
