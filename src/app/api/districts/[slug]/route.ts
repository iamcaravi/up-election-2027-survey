import { NextRequest, NextResponse } from "next/server";
import { getDistrictBySlug } from "@/lib/data";

// `state` is required, not defaulted — see /api/districts/route.ts for why.
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const stateSlug = req.nextUrl.searchParams.get("state");
  if (!stateSlug) {
    return NextResponse.json({ error: "Missing required ?state=<slug> parameter." }, { status: 400 });
  }
  const district = await getDistrictBySlug(stateSlug, slug);
  if (!district) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: district.id,
    name: district.name,
    slug: district.slug,
    constituencies: district.constituencies.map((c) => ({
      id: c.id,
      slug: c.slug,
      number: c.number,
      name: c.name,
      reservedStatus: c.reservedStatus,
      responseCount: c._count.surveyResponses,
      candidateCount: c._count.candidates,
    })),
  });
}
