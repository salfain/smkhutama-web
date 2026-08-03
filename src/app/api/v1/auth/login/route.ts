import type { NextRequest } from "next/server";
import { apiOk, handle, preflight, readJson } from "@/server/http";
import { login } from "@/server/modules/auth/service";

/** POST /api/v1/auth/login — body: { username, password, role?, system? } */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const body = await readJson(req);
    const result = await login({
      username: typeof body.username === "string" ? body.username : null,
      password: typeof body.password === "string" ? body.password : null,
      role: typeof body.role === "string" ? body.role : null,
      system: typeof body.system === "string" ? body.system : null,
    });
    return apiOk(result);
  });
}

export async function OPTIONS() {
  return preflight();
}
