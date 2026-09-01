import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, students, faculty, admins } from "@/db/schema";

export const SESSION_COOKIE = "vscms_erp_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  subRole?: string | null;
  rollNo?: string;
  rollNoOrEmpId: string;
  department: string;
  semester?: number | null;
  designation?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  gpa?: string | null;
  status: string;
  createdAt: string;
};

export async function createSession(userId: number, userRole = "student") {
  const token = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  await db.insert(sessions).values({ token, userId, userRole, expiresAt });
  return { token, expiresAt };
}

export function setSessionCookie(response: Response, token: string, expiresAt: number) {
  response.headers.append("Set-Cookie", `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor((expiresAt - Date.now()) / 1000)}`);
  return response;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const sess = await db.select().from(sessions).where(and(eq(sessions.token, token), gt(sessions.expiresAt, Date.now()))).limit(1);
  if (!sess[0]) return null;
  const { userId, userRole } = sess[0];

  if (userRole === "admin") {
    const res = await db.select().from(admins).where(eq(admins.id, userId)).limit(1);
    if (res[0]) return { ...res[0], role: "admin", rollNoOrEmpId: res[0].empId };
  } else if (userRole === "faculty") {
    const res = await db.select().from(faculty).where(eq(faculty.id, userId)).limit(1);
    if (res[0]) return { ...res[0], role: "faculty", rollNoOrEmpId: res[0].empId };
  } else {
    const res = await db.select().from(students).where(eq(students.id, userId)).limit(1);
    if (res[0]) return { ...res[0], role: "student", rollNoOrEmpId: res[0].rollNo };
  }
  return null;
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
