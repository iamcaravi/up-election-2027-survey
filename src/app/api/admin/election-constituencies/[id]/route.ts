import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { getElectionConstituencyRemovalBlockers } from "@/lib/admin-guards";

const updateSchema = z.object({ isActive: z.boolean() });

// Soft-disable a mapping (the "remove safely" default) without touching
// any candidates/surveys that reference this (electionId, constituencyId)
// pair directly.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const existing = await prisma.electionConstituency.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const mapping = await prisma.electionConstituency.update({ where: { id }, data: { isActive: parsed.data.isActive } });

  await logAudit({
    adminUserId: session.sub,
    action: parsed.data.isActive ? "ENABLE" : "DISABLE",
    entityType: "ElectionConstituency",
    entityId: id,
  });

  return NextResponse.json(mapping);
}

// Hard-removes a mapping — only when nothing depends on it. If the
// constituency already has candidates or a survey for this election, the
// mapping must be disabled (PATCH isActive:false) instead of removed, so
// that data is never silently orphaned from the membership record that
// justified its existence.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.electionConstituency.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const blocker = await getElectionConstituencyRemovalBlockers(prisma, existing.electionId, existing.constituencyId);
  if (blocker) return NextResponse.json(blocker, { status: 409 });

  await prisma.electionConstituency.delete({ where: { id } });
  await logAudit({ adminUserId: session.sub, action: "DELETE", entityType: "ElectionConstituency", entityId: id });

  return NextResponse.json({ ok: true });
}
