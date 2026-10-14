import { SignJWT, jwtVerify } from "jose";

/*
 * Session token helpers (jose HS256). Pure — no DB or Node-only imports — so it
 * is safe to use in the proxy as well as server code. The signing key comes
 * from SESSION_SECRET.
 */

export const SESSION_COOKIE = "loopsoop_admin";

export type SessionPayload = { uid: string; email: string };

/*
 * Signing secret. Prefer the configured SESSION_SECRET; fall back to a built-in
 * preview secret so the admin still works before hosting is set up (no-DB /
 * demo mode). In production with real data, always set SESSION_SECRET — the
 * fallback is public and therefore not secure for live deployments.
 */
const FALLBACK_SECRET = "loopsoop-local-preview-secret-change-me-in-production";
const key = () =>
  new TextEncoder().encode(process.env.SESSION_SECRET || FALLBACK_SECRET);

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key());
}

export async function verifySession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    if (typeof payload.uid === "string" && typeof payload.email === "string") {
      return { uid: payload.uid, email: payload.email };
    }
    return null;
  } catch {
    return null;
  }
}
