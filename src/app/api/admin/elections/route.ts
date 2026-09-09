import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { slugify, isValidSlug } from "@/lib/slugify";

const ELECTION_TYPES = ["ASSEMBLY", "LOK_SABHA", "LOCAL"] as const;
const ELECTION_STATUSES = ["UPCOMING", "ONGOING", "COMPLETED"] as const;

const createSchema = z.object({
  stateId: z.string().min(1),
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(100).optional(),
  electionType: z.enum(ELECTION_TYPES).optional(),
  year: z.number().int().min(1950).max(2100),
  status: z.enum(ELECTION_STATUSES).optional(),
  electionDate: z.string().datetime().optional().nullable(),
  description: z.string().trim().max(2000).optional(),
  isActive: z.boolean().optional(),
});

// state is required, never defaulted — every list of elections must be
// scoped to a caller-specified state, exactly like the public APIs.
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stateId = req.nextUrl.searchParams.get("stateId");
  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (!stateId) {
    return NextResponse.json({ error: "Missing required ?stateId= parameter." }, { status: 400 });
  }

  const elections = await prisma.election.findMany({
    where: {
      stateId,
      ...(q ? { name: { contains: q } } : {}),
    },
    include: {
      state: { select: { name: true, slug: true } },
      _count: { select: { candidates: true, surveys: true, electionConstituencies: true } },
    },
    orderBy: { year: "desc" },
    take: 200,
  });
  return NextResponse.json(elections);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const data = parsed.data;

  const state = await prisma.state.findUnique({ where: { id: data.stateId } });
  if (!state) return NextResponse.json({ error: "State not found." }, { status: 404 });

  const slug = data.slug ? slugify(data.slug) : slugify(data.name);
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Slug must be lowercase letters, numbers and single hyphens only." }, { status: 400 });
  }

  const clash = await prisma.election.findUnique({ where: { stateId_slug: { stateId: state.id, slug } } });
  if (clash) {
    return NextResponse.json({ error: `An election with slug "${slug}" already exists in ${state.name}.` }, { status: 409 });
  }

  const election = await prisma.election.create({
    data: {
      stateId: state.id,
      name: data.name,
      slug,
      electionType: data.electionType ?? "ASSEMBLY",
      year: data.year,
      status: data.status ?? "UPCOMING",
      electionDate: data.electionDate ? new Date(data.electionDate) : null,
      description: data.description || null,
      isActive: data.isActive ?? true,
    },
  });

  await logAudit({
    adminUserId: session.sub,
    action: "CREATE",
    entityType: "Election",
    entityId: election.id,
    metadata: { name: election.name, stateId: state.id, slug: election.slug },
  });

  return NextResponse.json(election, { status: 201 });
}
