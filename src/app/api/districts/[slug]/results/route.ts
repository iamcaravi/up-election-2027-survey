import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublicStatewideResults } from "@/lib/public-statewide-results";

// Mirrors /api/constituencies/[slug]/results — same state-scoped slug lookup,
// same "election defaults to the state's current active election" behavior —
// but pools results across every constituency in this district instead of a
// single constituency (see getPublicStatewideResults's `district` param).
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const stateSlug = req.nextUrl.searchParams.get("state");
  const electionSlug = req.nextUrl.searchParams.get("election");
  if (!stateSlug) {
    return NextResponse.json({ error: "Missing required ?state=<slug> parameter." }, { status: 400 });
  }

  const state = await prisma.state.findUnique({ where: { slug: stateSlug } });
  if (!state) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const election = electionSlug
    ? await prisma.election.findUnique({ where: { stateId_slug: { stateId: state.id, slug: electionSlug } } })
    : await prisma.election.findFirst({ where: { stateId: state.id, isActive: true }, orderBy: { year: "desc" } });
  if (!election) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // District slug is only unique within a state, so it must be resolved
  // scoped to the resolved state — never globally.
  const district = await prisma.district.findUnique({
    where: { stateId_slug: { stateId: state.id, slug } },
    select: { id: true, name: true, slug: true },
  });
  if (!district) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const results = await getPublicStatewideResults(election.id, district);
  if (!results) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(results, { headers: { "Cache-Control": "no-store" } });
}
