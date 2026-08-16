import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

export const SESSION_COOKIE = "apex_erp_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export type AuthUser = Omit<typeof users.$inferSelect, "passwordHash"> & { rollNoOrEmpId: string };

export function publicUser(user: typeof users.$inferSelect): AuthUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return {
    ...safeUser,
    rollNoOrEmpId: safeUser.rollNo,
  };
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  await db.insert(sessions).values({ token, userId, expiresAt });
  return { token, expiresAt };
}

export function setSessionCookie(response: Response, token: string, expiresAt: number) {
  response.headers.append("Set-Cookie", `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor((expiresAt - Date.now()) / 1000)}`);
  return response;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const result = await db.select({ user: users }).from(sessions).innerJoin(users, eq(sessions.userId, users.id)).where(and(eq(sessions.token, token), gt(sessions.expiresAt, Date.now()))).limit(1);
  return result[0] ? publicUser(result[0].user) : null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function clearCurrentSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.token, token));
}
