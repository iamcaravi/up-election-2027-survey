import type { Metadata } from "next";
import { getStates } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { StatesGrid } from "@/components/states/StatesGrid";
import { AnalysisLandingBreadcrumb } from "@/components/analysis/AnalysisLandingBreadcrumb";
import { getServerLocale } from "@/lib/i18n/locale-cookie";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return locale === "hi"
    ? { title: "विश्लेषण", description: "पार्टी समर्थन, मुख्य मुद्दे और मतदाता रुझान — विस्तृत चुनाव विश्लेषण देखने के लिए एक राज्य चुनें।" }
    : { title: "Analysis", description: "Select a state to explore its detailed election analysis — party support, key issues and voter trends." };
}

export const revalidate = 60;

// The standalone Analysis journey's entry point: Analysis → pick a state →
// that state's analysis dashboard (src/app/[state]/elections/[election]/
// analysis/page.tsx, reached via /analysis/[state]'s redirect). Deliberately
// independent of Find Constituency / Results / Election Overview — a
// visitor clicking "Analysis" from the header or homepage card lands here
// directly, never on a district/constituency browsing page.
export default async function AnalysisLandingPage() {
  const states = await getStates();

  return (
    <Container className="py-14">
      <AnalysisLandingBreadcrumb />
      <StatesGrid states={states} variant="analysis" />
    </Container>
  );
}
