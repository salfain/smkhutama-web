import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "cbt-smkhutama-secret-key-change-in-production"
);

export async function createToken(userId: string, role: string): Promise<string> {
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<{ userId: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return { userId: payload.userId as string, role: payload.role as string };
  } catch {
    return null;
  }
}
