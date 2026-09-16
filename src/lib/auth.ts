import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { AdminRole } from "./enums";

const COOKIE_NAME = "up2027_admin_session";
const SESSION_DURATION = 60 * 60 * 8; // 8 hours

function getSessionSecret(): Uint8Array {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET must be configured.");
  }
  return new TextEncoder().encode(sessionSecret);
}

export interface AdminSession {
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
}

export async function createAdminSession(user: AdminSession) {
  const token = await new SignJWT({ email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSessionSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as AdminRole,
    };
  } catch {
    return null;
  }
}

// Small, reusable role check for routes that need more than "is logged in"
// (getAdminSession() already covers that) — e.g. content-mutating CMS
// routes that shouldn't be reachable by a MODERATOR account whose role
// exists for survey-response moderation, not site content. Every existing
// route keeps checking `!session` itself exactly as before; this is purely
// additive for new call sites that opt in.
export function hasAdminRole(session: AdminSession | null, allowed: readonly AdminRole[]): boolean {
  return !!session && allowed.includes(session.role);
}

export async function verifyAdminCredentials(email: string, password: string) {
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user || !user.isActive) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return user;
}

export async function logAudit(params: {
  adminUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      adminUserId: params.adminUserId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    },
  });
}
