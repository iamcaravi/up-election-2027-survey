import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isRateLimited } from "@/lib/rate-limit";
import { getClientIp, saltedHash } from "@/lib/hash";
import { validatePasswordResetToken, consumePasswordResetToken } from "@/lib/password-reset";

const resetSchema = z
  .object({
    token: z.string().min(1, "Reset token is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm the new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation do not match.",
    path: ["confirmPassword"],
  });

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ valid: false, error: "Reset token is required." }, { status: 400 });
  }

  const validation = await validatePasswordResetToken(token);
  if (!validation.valid) {
    return NextResponse.json({ valid: false, error: validation.error }, { status: 400 });
  }

  return NextResponse.json({ valid: true });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (isRateLimited(`admin-reset-pwd-ip:${saltedHash(ip)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many reset attempts. Please wait a few minutes before trying again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid password data." },
      { status: 400 }
    );
  }

  const result = await consumePasswordResetToken(parsed.data.token, parsed.data.newPassword);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "Failed to reset password. The link may have expired or been used." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Password reset successfully. Please log in.",
  });
}
