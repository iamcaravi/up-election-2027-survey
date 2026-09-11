import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAdminSession, createAdminSession, logAudit } from "@/lib/auth";
import type { AdminRole } from "@/lib/enums";

const schema = z.object({
  newEmail: z.string().trim().toLowerCase().email("Enter a valid email address."),
  currentPassword: z.string().min(1, "Current password is required."),
});

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const user = await prisma.adminUser.findUnique({ where: { id: session.sub } });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  if (parsed.data.newEmail === user.email) {
    return NextResponse.json({ error: "That is already your current email." }, { status: 400 });
  }

  const existing = await prisma.adminUser.findUnique({ where: { email: parsed.data.newEmail } });
  if (existing) {
    return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
  }

  const updated = await prisma.adminUser.update({
    where: { id: user.id },
    data: { email: parsed.data.newEmail },
  });

  // Re-issue the session cookie so the currently signed-in admin stays logged
  // in with the new email reflected immediately, instead of being logged out.
  await createAdminSession({
    sub: updated.id,
    email: updated.email,
    name: updated.name,
    role: updated.role as AdminRole,
  });

  await logAudit({
    adminUserId: user.id,
    action: "CHANGE_EMAIL",
    entityType: "AdminUser",
    entityId: user.id,
    metadata: { newEmail: updated.email },
  });

  return NextResponse.json({ ok: true, email: updated.email });
}
