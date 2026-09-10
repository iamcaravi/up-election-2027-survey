import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublicSurveyResults } from "@/lib/public-survey-results";

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

  // constituency slug is only unique within a state, so it must be looked
  // up scoped to the resolved state — never globally.
  const constituency = await prisma.constituency.findUnique({
    where: { stateId_slug: { stateId: state.id, slug } },
    select: { id: true },
  });
  if (!constituency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const results = await getPublicSurveyResults(election.id, constituency.id);
  if (!results) return NextResponse.json({ error: "No survey" }, { status: 404 });

  return NextResponse.json(
    {
      survey: results.survey,
      visibility: results.visibility,
      sample: results.sample,
      demographics: results.analytics?.demographics ?? null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
