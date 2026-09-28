import { redirect } from "next/navigation";
import { getConstituencyBySlug } from "@/lib/data";
import { resultsPath } from "@/lib/routes";

// Legacy deep result URL. The constituency result is now rendered by the
// single canonical Result page; this keeps old links (and any cached survey
// "परिणाम देखें" link) working, with the full State → District → Assembly
// scope preserved.
export const dynamic = "force-dynamic";

export default async function LegacyConstituencyResultsRedirect({
  params,
}: {
  params: Promise<{ state: string; election: string; constituency: string }>;
}) {
  const { state, election, constituency } = await params;
  const c = await getConstituencyBySlug(state, constituency, election);
  redirect(c ? resultsPath({ state, district: c.district.slug, constituency: c.slug }) : resultsPath({ state }));
}
