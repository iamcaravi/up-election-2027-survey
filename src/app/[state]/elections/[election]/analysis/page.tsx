import { redirect } from "next/navigation";
import { analysisScopePath } from "@/lib/routes";

// Legacy state-analysis URL — the analysis now lives on the single canonical
// Analysis page (State / District / Assembly scope). Redirect with the state
// scope preserved so existing links and bookmarks keep working.
export default async function LegacyStateAnalysisRedirect({ params }: { params: Promise<{ state: string; election: string }> }) {
  const { state } = await params;
  redirect(analysisScopePath({ state }));
}
