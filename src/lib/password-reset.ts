import "server-only";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { logAudit } from "./auth";

const TOKEN_EXPIRY_MS = 45 * 60 * 1000; // 45 minutes

// In-memory token store for local dev when DB table is not yet migrated
interface MemoryToken {
  id: string;
  adminUserId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

const devMemoryTokens = new Map<string, MemoryToken>();

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Creates a cryptographically secure, single-use password reset token for an admin user.
 * Returns the raw token (to be sent via email/reset URL).
 */
export async function createPasswordResetToken(adminUserId: string): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

  try {
    // Invalidate existing unused tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { adminUserId, usedAt: null },
    });

    await prisma.passwordResetToken.create({
      data: {
        adminUserId,
        tokenHash,
        expiresAt,
      },
    });
  } catch (error: unknown) {
    // If the database table does not exist yet (pending migration), allow dev testing via memory store
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[PasswordReset] DB table 'password_reset_tokens' not found. Using dev in-memory fallback for testing."
      );
      // Remove any existing tokens for this admin
      for (const [hash, token] of devMemoryTokens.entries()) {
        if (token.adminUserId === adminUserId && !token.usedAt) {
          devMemoryTokens.delete(hash);
        }
      }
      devMemoryTokens.set(tokenHash, {
        id: crypto.randomUUID(),
        adminUserId,
        tokenHash,
        expiresAt,
        usedAt: null,
        createdAt: new Date(),
      });
    } else {
      throw error;
    }
  }

  return rawToken;
}

export interface ValidationResult {
  valid: boolean;
  adminUserId?: string;
  userEmail?: string;
  error?: string;
}

/**
 * Validates a raw password reset token without consuming it.
 */
export async function validatePasswordResetToken(rawToken: string): Promise<ValidationResult> {
  if (!rawToken || typeof rawToken !== "string") {
    return { valid: false, error: "Missing or invalid reset token." };
  }

  const tokenHash = hashToken(rawToken);

  try {
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { adminUser: true },
    });

    if (record) {
      if (record.usedAt) {
        return { valid: false, error: "This password reset link has already been used." };
      }
      if (record.expiresAt < new Date()) {
        return { valid: false, error: "This password reset link has expired." };
      }
      if (!record.adminUser || !record.adminUser.isActive) {
        return { valid: false, error: "Admin account is inactive or not found." };
      }
      return { valid: true, adminUserId: record.adminUserId, userEmail: record.adminUser.email };
    }
  } catch {
    // If DB query fails (e.g. table not migrated), fall through to dev memory check
  }

  if (process.env.NODE_ENV !== "production") {
    const memRecord = devMemoryTokens.get(tokenHash);
    if (memRecord) {
      if (memRecord.usedAt) {
        return { valid: false, error: "This password reset link has already been used." };
      }
      if (memRecord.expiresAt < new Date()) {
        return { valid: false, error: "This password reset link has expired." };
      }
      const user = await prisma.adminUser.findUnique({ where: { id: memRecord.adminUserId } });
      if (!user || !user.isActive) {
        return { valid: false, error: "Admin account is inactive or not found." };
      }
      return { valid: true, adminUserId: memRecord.adminUserId, userEmail: user.email };
    }
  }

  return { valid: false, error: "Invalid or expired password reset link." };
}

/**
 * Consumes a password reset token and updates the admin user's password.
 */
export async function consumePasswordResetToken(
  rawToken: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const validation = await validatePasswordResetToken(rawToken);
  if (!validation.valid || !validation.adminUserId) {
    return { success: false, error: validation.error ?? "Invalid reset token." };
  }

  const tokenHash = hashToken(rawToken);
  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Update password in database
  await prisma.adminUser.update({
    where: { id: validation.adminUserId },
    data: { passwordHash },
  });

  // Mark token as used
  try {
    await prisma.passwordResetToken.update({
      where: { tokenHash },
      data: { usedAt: new Date() },
    });
  } catch {
    if (process.env.NODE_ENV !== "production") {
      const memRecord = devMemoryTokens.get(tokenHash);
      if (memRecord) {
        memRecord.usedAt = new Date();
      }
    }
  }

  await logAudit({
    adminUserId: validation.adminUserId,
    action: "RESET_PASSWORD",
    entityType: "AdminUser",
    entityId: validation.adminUserId,
    metadata: {
      email: validation.userEmail,
      method: "forgot_password_token",
    },
  });

  return { success: true };
}
