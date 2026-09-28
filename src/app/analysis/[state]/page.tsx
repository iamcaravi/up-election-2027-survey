import { redirect } from "next/navigation";
import { analysisScopePath } from "@/lib/routes";

// Legacy URL (/analysis/[state]) — redirects to the single canonical Analysis
// page with the state scope preserved.
export default async function LegacyAnalysisStateRedirect({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  redirect(analysisScopePath({ state }));
}
