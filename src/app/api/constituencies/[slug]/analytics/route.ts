import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConstituencyDemographicBreakdown, type DemographicDimension } from "@/lib/analytics";

const VALID_DIMENSIONS: DemographicDimension[] = ["age_group", "gender", "social_category", "religion"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const stateSlug = req.nextUrl.searchParams.get("state");
  const electionSlug = req.nextUrl.searchParams.get("election");
  const dimension = (req.nextUrl.searchParams.get("dimension") ?? "age_group") as DemographicDimension;
  const target = (req.nextUrl.searchParams.get("target") ?? "candidate_choice") as
    | "candidate_choice"
    | "party_preference";

  if (!VALID_DIMENSIONS.includes(dimension)) {
    return NextResponse.json({ error: "Invalid dimension" }, { status: 400 });
  }
  if (!stateSlug) {
    return NextResponse.json({ error: "Missing required ?state=<slug> parameter." }, { status: 400 });
  }

  const state = await prisma.state.findUnique({ where: { slug: stateSlug } });
  if (!state) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const election = electionSlug
    ? await prisma.election.findUnique({ where: { stateId_slug: { stateId: state.id, slug: electionSlug } } })
    : await prisma.election.findFirst({ where: { stateId: state.id, isActive: true }, orderBy: { year: "desc" } });
  if (!election) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // constituency slug is only unique within a state, so it must be looked
  // up scoped to the resolved state — never globally.
  const constituency = await prisma.constituency.findUnique({
    where: { stateId_slug: { stateId: state.id, slug } },
    select: { id: true },
  });
  if (!constituency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const breakdown = await getConstituencyDemographicBreakdown(constituency.id, election.id, dimension, target);
  if (!breakdown) return NextResponse.json({ error: "No active survey" }, { status: 404 });

  return NextResponse.json(breakdown);
}
