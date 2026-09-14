import type { Metadata } from "next";
import { getStates } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { FindConstituencyBreadcrumbHeading } from "@/components/find-constituency/FindConstituencyHeading";
import { FindConstituencyFlow } from "@/components/find-constituency/FindConstituencyFlow";
import { getServerLocale } from "@/lib/i18n/locale-cookie";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return locale === "hi"
    ? { title: "अपना विधानसभा क्षेत्र खोजें", description: "सार्वजनिक सर्वे में भाग लेने या परिणाम देखने के लिए अपना राज्य, जिला और विधानसभा क्षेत्र चुनें।" }
    : { title: "Find Constituency", description: "Select your state, district and assembly constituency to take the public survey or see its results." };
}

export const revalidate = 60;

// A standalone discovery journey — Find Constituency → State → District →
// Constituency → Take Survey / View Results — independent from Analysis and
// from the district-directory browsing flow (State → Explore Districts →
// District → Constituency). See routes.ts's Results-journey comment for the
// equivalent reasoning on why this doesn't reuse the district/election pages.
export default async function FindConstituencyPage() {
  const states = await getStates();
  const stateOptions = states.map((s) => ({
    slug: s.slug,
    name: s.name,
    electionSlug: s.elections[0]?.slug ?? null,
  }));

  return (
    <Container className="py-12">
      <FindConstituencyBreadcrumbHeading />
      <div className="mt-8 max-w-3xl">
        <FindConstituencyFlow states={stateOptions} />
      </div>
    </Container>
  );
}
