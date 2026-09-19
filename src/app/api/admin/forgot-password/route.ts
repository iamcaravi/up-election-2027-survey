import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";
import { getClientIp, saltedHash } from "@/lib/hash";
import { createPasswordResetToken } from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";
import { logAudit } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

// A constant dummy hash for timing attack mitigation
const DUMMY_HASH = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4h/9f/Vf.C";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (isRateLimited(`admin-forgot-pwd-ip:${saltedHash(ip)}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many reset requests. Please wait a few minutes before trying again." },
      { status: 429 }
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email address." },
      { status: 400 }
    );
  }

  const normalizedEmail = parsed.data.email.toLowerCase().trim();

  if (isRateLimited(`admin-forgot-pwd-email:${saltedHash(normalizedEmail)}`, 3, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many reset requests for this account. Please wait before trying again." },
      { status: 429 }
    );
  }

  const user = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
  });

  const genericResponse = {
    ok: true,
    message: "If an account exists for this email, a password reset link has been sent.",
  };

  if (user && user.isActive) {
    const rawToken = await createPasswordResetToken(user.id);

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
    const origin = `${proto}://${host}`;
    const resetUrl = `${origin}/admin/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail({
      email: user.email,
      resetUrl,
    });

    await logAudit({
      adminUserId: user.id,
      action: "FORGOT_PASSWORD_REQUEST",
      entityType: "AdminUser",
      entityId: user.id,
      metadata: { email: user.email },
    });
  } else {
    // Artificial timing delay to prevent timing-based user enumeration
    await bcrypt.compare("nonexistent-timing-guard", DUMMY_HASH);
  }

  return NextResponse.json(genericResponse);
}
