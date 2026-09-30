import { NextRequest, NextResponse } from "next/server";
import { apiServerError } from "@/lib/api-errors";
import { getDistricts, getStateBySlug } from "@/lib/data";

// `state` is required, not defaulted — an implicit default is exactly the
// kind of silent cross-state ambiguity a second state must not hit. No
// internal caller depends on an unscoped request (verified: nothing in
// src/ fetches this route), so there is no compatibility cost to requiring it.
export async function GET(req: NextRequest) {
  const stateSlug = req.nextUrl.searchParams.get("state");
  if (!stateSlug) {
    return NextResponse.json({ error: "Missing required ?state=<slug> parameter." }, { status: 400 });
  }

  try {
    const state = await getStateBySlug(stateSlug);
    if (!state) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { districts } = await getDistricts(stateSlug);
    return NextResponse.json(
      districts.map((d) => ({ id: d.id, name: d.name, slug: d.slug, constituencyCount: d._count.constituencies }))
    );
  } catch (error) {
    return apiServerError("GET /api/districts", `getDistricts(state=${stateSlug})`, "DISTRICT_LIST_FAILED", error);
  }
}
