import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "kstar_admin";

function token(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  // Deterministic signed token; rotates when ADMIN_PASSWORD changes.
  return createHmac("sha256", pw).update("kstar-admin-v1").digest("hex");
}

export async function isAdmin(): Promise<boolean> {
  const expected = token();
  if (!expected) return false;
  const got = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!got || got.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

export async function signInAdmin(password: string): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || password !== pw) return false;
  (await cookies()).set(ADMIN_COOKIE, token()!, {
    httpOnly: true, sameSite: "lax", secure: true, path: "/admin", maxAge: 60 * 60 * 24 * 14,
  });
  return true;
}

export async function signOutAdmin(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}
