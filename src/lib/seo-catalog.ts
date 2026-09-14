import "server-only";
import { getStateAndElection } from "./data";
import { displayStateName } from "./utils";
import { statePath, stateResultsPath, analysisPath } from "./routes";
import type { Locale } from "./i18n/LocaleProvider";

// The fixed set of pages Admin → SEO can manage this phase — deliberately
// NOT "every route in the app" (district/constituency/election/survey
// pages already have per-page generateMetadata() from the earlier
// launch-readiness pass and are left alone here). Title/description below
// are literal copies of what each page's own generateMetadata()/metadata
// export currently produces — kept here as the single source both the
// admin "Generated Default" preview and the live pages read, so the two
// can never drift apart. Each is now `{hi, en}` — the same key set as
// every other translated pair in this codebase — since a page's SEO title
// must match the language it actually renders in for that visitor.
export type SeoStaticCategory = "home" | "about" | "contact" | "privacy" | "terms" | "disclaimer" | "faq" | "methodology";
export type SeoStateScopedCategory = "state" | "results" | "analysis";
export type SeoCategory = SeoStaticCategory | SeoStateScopedCategory;

interface LocalizedCopy {
  title: string;
  description: string;
}

export interface SeoCatalogEntry {
  category: SeoStaticCategory;
  label: string;
  path: string;
  hi: LocalizedCopy;
  en: LocalizedCopy;
}

export const SEO_STATIC_CATALOG: SeoCatalogEntry[] = [
  {
    category: "home",
    label: "Homepage",
    path: "/",
    hi: {
      title: "भारत चुनाव | जनता का मूड — राज्यों के चुनाव",
      description:
        "राज्यों के चुनाव, उम्मीदवार, चुनावी मुद्दे और जनता की राय को एक जगह explore करें। स्वैच्छिक सार्वजनिक सर्वे पर आधारित — यह कोई आधिकारिक चुनाव परिणाम नहीं है।",
    },
    en: {
      title: "Bharat Chunav | Public Mood — State Elections",
      description:
        "Explore state elections, candidates, key issues and public opinion in one place. Based on a voluntary public survey — not an official election result.",
    },
  },
  {
    category: "about",
    label: "About Us",
    path: "/about",
    hi: {
      title: "हमारे बारे में",
      description: "votersurvey.in एक स्वतंत्र, स्वैच्छिक जनमत सर्वे मंच है — किसी भी राजनीतिक दल से स्वतंत्र।",
    },
    en: {
      title: "About Us",
      description: "votersurvey.in is an independent, voluntary public-opinion survey platform — free from any political party.",
    },
  },
  {
    category: "contact",
    label: "Contact Us",
    path: "/contact",
    hi: {
      title: "संपर्क करें",
      description:
        "सामान्य पूछताछ, सर्वे या डेटा संबंधी प्रश्न, तकनीकी सहायता, गोपनीयता अनुरोध, या चुनाव/नियामक संचार के लिए VoterSurvey.in से संपर्क करें।",
    },
    en: {
      title: "Contact Us",
      description:
        "Get in touch with VoterSurvey.in for general enquiries, survey or data questions, technical support, privacy requests, or election/regulatory communication.",
    },
  },
  {
    category: "privacy",
    label: "Privacy Policy",
    path: "/privacy",
    hi: {
      title: "गोपनीयता नीति",
      description: "VoterSurvey.in सर्वे डेटा को कैसे संभालता है — क्या एकत्र किया जाता है, डुप्लिकेट पहचान कैसे काम करती है, और क्या कभी नहीं पूछा या प्रकाशित किया जाता।",
    },
    en: {
      title: "Privacy Policy",
      description: "How VoterSurvey.in handles survey data — what is collected, how duplicate detection works, and what is never asked for or published.",
    },
  },
  {
    category: "terms",
    label: "Terms of Use",
    path: "/terms",
    hi: {
      title: "उपयोग की शर्तें",
      description: "VoterSurvey.in के सर्वे, परिणाम और उम्मीदवार जानकारी के उपयोग को नियंत्रित करने वाली शर्तें।",
    },
    en: {
      title: "Terms of Use",
      description: "The terms governing use of VoterSurvey.in's survey, results, and candidate information.",
    },
  },
  {
    category: "disclaimer",
    label: "Disclaimer",
    path: "/disclaimer",
    hi: {
      title: "अस्वीकरण",
      description:
        "VoterSurvey.in एक स्वतंत्र राय/सर्वे मंच है। सर्वे परिणाम आधिकारिक चुनाव परिणाम नहीं हैं और भारत निर्वाचन आयोग से संबद्ध नहीं हैं।",
    },
    en: {
      title: "Disclaimer",
      description:
        "VoterSurvey.in is an independent opinion/survey platform. Survey results are not official election results and are not affiliated with the Election Commission of India.",
    },
  },
  {
    category: "faq",
    label: "FAQ",
    path: "/faq",
    hi: {
      title: "अक्सर पूछे जाने वाले प्रश्न",
      description:
        "VoterSurvey.in का सर्वे कैसे काम करता है, परिणाम और मुद्दा प्रतिशत की गणना कैसे होती है, गोपनीयता सुरक्षा, और भारत निर्वाचन आयोग के साथ मंच के संबंध के बारे में उत्तर।",
    },
    en: {
      title: "Frequently Asked Questions",
      description:
        "Answers about how VoterSurvey.in's survey works, how results and issue percentages are calculated, privacy protections, and the platform's relationship with the Election Commission of India.",
    },
  },
  {
    category: "methodology",
    label: "Methodology",
    path: "/methodology",
    hi: {
      title: "पद्धति",
      description: "VoterSurvey.in सार्वजनिक सर्वे प्रतिक्रियाओं को कैसे एकत्र, सत्यापित और समेकित करता है।",
    },
    en: {
      title: "Methodology",
      description: "How VoterSurvey.in collects, validates and aggregates public survey responses.",
    },
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

export function resolveStaticSeoBase(category: SeoStaticCategory, locale: Locale): ResolvedSeoBase {
  const entry = SEO_STATIC_CATALOG.find((e) => e.category === category)!;
  const copy = entry[locale];
  return { path: entry.path, title: copy.title, description: copy.description };
}

// Mirrors the exact title/description each state-scoped page's own
// generateMetadata() already computes (src/app/[state]/page.tsx,
// src/app/results/[state]/page.tsx, src/app/[state]/elections/[election]/
// analysis/page.tsx) — returns null when the state/election can't resolve,
// same as those pages returning {} in that case.
export async function resolveStateScopedSeoBase(category: SeoStateScopedCategory, stateSlug: string, locale: Locale): Promise<ResolvedSeoBase | null> {
  const result = await getStateAndElection(stateSlug);
  if (!result) return null;
  const stateName = displayStateName(result.state.name, result.state.slug, locale);

  if (category === "state") {
    return {
      path: statePath(result.state.slug),
      title: locale === "hi" ? `${stateName} चुनाव सर्वेक्षण` : `${stateName} Election Survey`,
      description:
        locale === "hi"
          ? `${stateName}: जिले, विधानसभा क्षेत्र, उम्मीदवार और सार्वजनिक सर्वे${result.election ? ` — ${result.election.name}` : ""}।`
          : `${stateName}: districts, assembly constituencies, candidates and public survey${result.election ? ` for the ${result.election.name}` : ""}.`,
    };
  }
  if (category === "results") {
    return {
      path: stateResultsPath(result.state.slug),
      title: locale === "hi" ? `${stateName} — परिणाम` : `${stateName} — Results`,
      description:
        locale === "hi"
          ? `${stateName} के जनमत सर्वे के परिणाम — पार्टी समर्थन, मुख्य मुद्दे और जिला/विधानसभा क्षेत्रवार परिणाम।`
          : `${stateName} public survey results — party support, key issues, and district/constituency-level results.`,
    };
  }
  if (!result.election) return null;
  return {
    path: analysisPath(result.state.slug, result.election.slug),
    title: locale === "hi" ? `${stateName} चुनाव विश्लेषण` : `${stateName} Election Analysis`,
    description:
      locale === "hi"
        ? `${stateName} के जनमत सर्वेक्षण का विस्तृत विश्लेषण — पार्टी समर्थन, मुख्य मुद्दे और मतदाता प्रोफ़ाइल।`
        : `Detailed analysis of ${stateName}'s public survey — party support, key issues, and voter profile.`,
  };
}
