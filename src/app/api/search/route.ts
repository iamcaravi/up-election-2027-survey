import { NextRequest, NextResponse } from "next/server";
import { searchAll } from "@/lib/data";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return NextResponse.json({ districts: [], constituencies: [], candidates: [] });
  }
  const results = await searchAll(q);
  return NextResponse.json({
    districts: results.districts.map((d) => ({ type: "district", slug: d.slug, name: d.name })),
    constituencies: results.constituencies.map((c) => ({
      type: "constituency",
      slug: c.slug,
      name: c.name,
      districtName: c.district.name,
      districtSlug: c.district.slug,
      number: c.number,
    })),
    candidates: results.candidates.map((c) => ({
      type: "candidate",
      slug: c.slug,
      name: c.name,
      partyShortName: c.party?.shortName,
      constituencyName: c.constituency.name,
      constituencySlug: c.constituency.slug,
      districtSlug: c.constituency.district.slug,
    })),
  });
}
