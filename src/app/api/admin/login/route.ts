import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminCredentials, createAdminSession, logAudit } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";
import { getClientIp, saltedHash } from "@/lib/hash";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (isRateLimited(`admin-login:${saltedHash(ip)}`, 10, 5 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
  }

  const user = await verifyAdminCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await createAdminSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "ADMIN" | "EDITOR" | "MODERATOR",
  });
  await logAudit({ adminUserId: user.id, action: "LOGIN", entityType: "AdminUser", entityId: user.id });

  return NextResponse.json({ ok: true });
}
