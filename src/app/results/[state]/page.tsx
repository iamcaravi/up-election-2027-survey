import { redirect } from "next/navigation";
import { resultsPath } from "@/lib/routes";

// Legacy URL (/results/[state]) — the state result now lives on the single
// canonical Result page. Kept as a redirect so existing links/bookmarks keep
// working with their scope preserved.
export default async function LegacyStateResultsRedirect({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  redirect(resultsPath({ state }));
}
