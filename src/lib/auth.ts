import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { query } from "./db";
import {
  SESSION_COOKIE,
  signSession,
  verifySession,
  type SessionPayload,
} from "./session";

/*
 * Server-side auth (replaces Supabase Auth). Verifies credentials against the
 * MySQL `users` table (bcrypt), and manages a signed httpOnly session cookie.
 */

type DbUser = { id: string; email: string; password_hash: string };

/** Returns the user if email+password match, else null. */
export async function authenticate(
  email: string,
  password: string,
): Promise<{ id: string; email: string } | null> {
  const rows = await query<DbUser>(
    "SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1",
    [email.trim().toLowerCase()],
  );
  const user = rows[0];
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? { id: user.id, email: user.email } : null;
}

export async function startSession(user: { id: string; email: string }) {
  const token = await signSession({ uid: user.id, email: user.email });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Current admin session, or null. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Throws UNAUTHORIZED if not signed in — call at the top of every mutation. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}
