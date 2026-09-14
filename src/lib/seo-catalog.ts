import "server-only";
import { getStateAndElection } from "./data";
import { displayStateName } from "./utils";
import { statePath, stateResultsPath, analysisPath } from "./routes";

// The fixed set of pages Admin → SEO can manage this phase — deliberately
// NOT "every route in the app" (district/constituency/election/survey
// pages already have per-page generateMetadata() from the earlier
// launch-readiness pass and are left alone here). Title/description below
// are literal copies of what each page's own generateMetadata()/metadata
// export currently produces — kept here as the single source both the
// admin "Generated Default" preview and the live pages read, so the two
// can never drift apart.
export type SeoStaticCategory = "home" | "about" | "contact" | "privacy" | "terms" | "disclaimer" | "faq" | "methodology";
export type SeoStateScopedCategory = "state" | "results" | "analysis";
export type SeoCategory = SeoStaticCategory | SeoStateScopedCategory;

export interface SeoCatalogEntry {
  category: SeoStaticCategory;
  label: string;
  path: string;
  title: string;
  description: string;
}

export const SEO_STATIC_CATALOG: SeoCatalogEntry[] = [
  {
    category: "home",
    label: "Homepage",
    path: "/",
    title: "भारत चुनाव | जनता का मूड — राज्यों के चुनाव",
    description:
      "राज्यों के चुनाव, उम्मीदवार, चुनावी मुद्दे और जनता की राय को एक जगह explore करें। स्वैच्छिक सार्वजनिक सर्वे पर आधारित — यह कोई आधिकारिक चुनाव परिणाम नहीं है।",
  },
  {
    category: "about",
    label: "About Us",
    path: "/about",
    title: "हमारे बारे में",
    description: "votersurvey.in एक स्वतंत्र, स्वैच्छिक जनमत सर्वे मंच है — किसी भी राजनीतिक दल से स्वतंत्र।",
  },
  {
    category: "contact",
    label: "Contact Us",
    path: "/contact",
    title: "Contact Us",
    description:
      "Get in touch with VoterSurvey.in for general enquiries, survey or data questions, technical support, privacy requests, or election/regulatory communication.",
  },
  {
    category: "privacy",
    label: "Privacy Policy",
    path: "/privacy",
    title: "Privacy Policy",
    description: "How VoterSurvey.in handles survey data — what is collected, how duplicate detection works, and what is never asked for or published.",
  },
  {
    category: "terms",
    label: "Terms of Use",
    path: "/terms",
    title: "Terms of Use",
    description: "The terms governing use of VoterSurvey.in's survey, results, and candidate information.",
  },
  {
    category: "disclaimer",
    label: "Disclaimer",
    path: "/disclaimer",
    title: "Disclaimer",
    description:
      "VoterSurvey.in is an independent opinion/survey platform. Survey results are not official election results and are not affiliated with the Election Commission of India.",
  },
  {
    category: "faq",
    label: "FAQ",
    path: "/faq",
    title: "Frequently Asked Questions",
    description:
      "Answers about how VoterSurvey.in's survey works, how results and issue percentages are calculated, privacy protections, and the platform's relationship with the Election Commission of India.",
  },
  {
    category: "methodology",
    label: "Methodology",
    path: "/methodology",
    title: "Methodology",
    description: "How VoterSurvey.in collects, validates and aggregates public survey responses.",
  },
];

export const SEO_STATE_SCOPED_CATALOG: { category: SeoStateScopedCategory; label: string }[] = [
  { category: "state", label: "State Page" },
  { category: "results", label: "Results Page" },
  { category: "analysis", label: "Analysis Page" },
];

export interface ResolvedSeoBase {
  path: string;
  title: string;
  description: string;
}

export function resolveStaticSeoBase(category: SeoStaticCategory): ResolvedSeoBase {
  const entry = SEO_STATIC_CATALOG.find((e) => e.category === category)!;
  return { path: entry.path, title: entry.title, description: entry.description };
}

// Mirrors the exact title/description each state-scoped page's own
// generateMetadata() already computes (src/app/[state]/page.tsx,
// src/app/results/[state]/page.tsx, src/app/[state]/elections/[election]/
// analysis/page.tsx) — returns null when the state/election can't resolve,
// same as those pages returning {} in that case.
export async function resolveStateScopedSeoBase(category: SeoStateScopedCategory, stateSlug: string): Promise<ResolvedSeoBase | null> {
  const result = await getStateAndElection(stateSlug);
  if (!result) return null;
  const stateNameHi = displayStateName(result.state.name, result.state.slug, "hi");

  if (category === "state") {
    return {
      path: statePath(result.state.slug),
      title: `${result.state.name} Election Survey`,
      description: `${result.state.name}: districts, assembly constituencies, candidates and public survey${
        result.election ? ` for the ${result.election.name}` : ""
      }.`,
    };
  }
  if (category === "results") {
    return {
      path: stateResultsPath(result.state.slug),
      title: `${stateNameHi} — परिणाम`,
      description: `${stateNameHi} के जनमत सर्वे के परिणाम — पार्टी समर्थन, मुख्य मुद्दे और जिला/विधानसभा क्षेत्रवार परिणाम।`,
    };
  }
  if (!result.election) return null;
  return {
    path: analysisPath(result.state.slug, result.election.slug),
    title: `${stateNameHi} चुनाव विश्लेषण`,
    description: `${stateNameHi} के जनमत सर्वेक्षण का विस्तृत विश्लेषण — पार्टी समर्थन, मुख्य मुद्दे और मतदाता प्रोफ़ाइल।`,
  };
}
