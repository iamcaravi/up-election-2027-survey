import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { slugify, isValidSlug } from "@/lib/slugify";
import { getElectionDeletionBlockers } from "@/lib/admin-guards";

const ELECTION_TYPES = ["ASSEMBLY", "LOK_SABHA", "LOCAL"] as const;
const ELECTION_STATUSES = ["UPCOMING", "ONGOING", "COMPLETED"] as const;

// stateId is intentionally NOT accepted here — an election's state is
// immutable after creation, so an update request can never silently move
// an election (and its candidates/surveys) to a different state.
const updateSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  slug: z.string().trim().min(2).max(100).optional(),
  electionType: z.enum(ELECTION_TYPES).optional(),
  year: z.number().int().min(1950).max(2100).optional(),
  status: z.enum(ELECTION_STATUSES).optional(),
  electionDate: z.string().datetime().nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const election = await prisma.election.findUnique({
    where: { id },
    include: {
      state: { select: { id: true, name: true, slug: true } },
      _count: { select: { candidates: true, surveys: true, electionConstituencies: true } },
    },
  });
  if (!election) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(election);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.election.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let slug: string | undefined;
  if (data.slug !== undefined) {
    slug = slugify(data.slug);
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: "Slug must be lowercase letters, numbers and single hyphens only." }, { status: 400 });
    }
    if (slug !== existing.slug) {
      const clash = await prisma.election.findUnique({ where: { stateId_slug: { stateId: existing.stateId, slug } } });
      if (clash) return NextResponse.json({ error: `An election with slug "${slug}" already exists in this state.` }, { status: 409 });
    }
  }

  const election = await prisma.election.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      electionType: data.electionType,
      year: data.year,
      status: data.status,
      electionDate: data.electionDate === undefined ? undefined : data.electionDate ? new Date(data.electionDate) : null,
      description: data.description,
      isActive: data.isActive,
    },
  });

  await logAudit({
    adminUserId: session.sub,
    action: "UPDATE",
    entityType: "Election",
    entityId: id,
    metadata: data,
  });

  return NextResponse.json(election);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.election.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const blocker = await getElectionDeletionBlockers(prisma, id);
  if (blocker) return NextResponse.json(blocker, { status: 409 });

  await prisma.election.delete({ where: { id } });
  await logAudit({ adminUserId: session.sub, action: "DELETE", entityType: "Election", entityId: id, metadata: { name: existing.name } });

  return NextResponse.json({ ok: true });
}
