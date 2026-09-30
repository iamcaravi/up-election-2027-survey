import { NextRequest, NextResponse } from "next/server";
import { apiServerError } from "@/lib/api-errors";
import { searchAll } from "@/lib/data";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return NextResponse.json({ districts: [], constituencies: [], candidates: [] });
  }

  let results: Awaited<ReturnType<typeof searchAll>>;
  try {
    results = await searchAll(q);
  } catch (error) {
    return apiServerError("GET /api/search", "searchAll", "SEARCH_FAILED", error);
  }

  return NextResponse.json({
    districts: results.districts.map((d) => ({
      type: "district",
      slug: d.slug,
      name: d.name,
      stateSlug: d.state.slug,
      electionSlug: d.electionSlug,
    })),
    constituencies: results.constituencies.map((c) => ({
      type: "constituency",
      slug: c.slug,
      name: c.name,
      districtName: c.district.name,
      stateSlug: c.state.slug,
      electionSlug: c.electionSlug,
      number: c.number,
    })),
    candidates: results.candidates.map((c) => ({
      type: "candidate",
      slug: c.slug,
      name: c.name,
      partyShortName: c.party?.shortName,
      constituencyName: c.constituency.name,
      constituencySlug: c.constituency.slug,
      stateSlug: c.constituency.state.slug,
      electionSlug: c.electionSlug,
    })),
  });
}
