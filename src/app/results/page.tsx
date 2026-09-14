import type { Metadata } from "next";
import { getStates } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { StatesGrid } from "@/components/states/StatesGrid";
import { ResultsLandingBreadcrumb } from "@/components/results/ResultsLandingBreadcrumb";
import { getServerLocale } from "@/lib/i18n/locale-cookie";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return locale === "hi"
    ? { title: "परिणाम", description: "इसके लाइव सार्वजनिक सर्वे परिणाम — पार्टी समर्थन, मुख्य मुद्दे और विधानसभा क्षेत्रवार परिणाम — देखने के लिए एक राज्य चुनें।" }
    : {
        title: "Results",
        description: "Select a state to view its live public survey results — party support, top issues and constituency-level results.",
      };
}

export const revalidate = 60;

// The standalone Results journey's entry point: Results → pick a state →
// that state's aggregate result overview (src/app/results/[state]/page.tsx)
// → pick a constituency → the existing canonical per-constituency result
// page. Deliberately independent of Find Constituency / Election Overview —
// a visitor clicking "Results" from the header, footer or homepage card
// lands here directly, never on a district/election browsing page.
export default async function ResultsLandingPage() {
  const states = await getStates();

  return (
    <Container className="py-14">
      <ResultsLandingBreadcrumb />
      <StatesGrid states={states} variant="results" />
    </Container>
  );
}
