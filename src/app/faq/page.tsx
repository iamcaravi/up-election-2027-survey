import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { loadPublishedFaqCategories } from "@/lib/faq-content";
import { buildPageMetadata } from "@/lib/seo";
import { resolveStaticSeoBase } from "@/lib/seo-catalog";
import { applySeoOverride } from "@/lib/seo-overrides";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import type { Locale } from "@/lib/i18n/LocaleProvider";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const base = resolveStaticSeoBase("faq", locale);
  return applySeoOverride(buildPageMetadata({ title: base.title, description: base.description, path: base.path }), base.path);
}

const COPY: Record<Locale, { breadcrumbHelp: string; breadcrumbFaq: string; eyebrow: string; heading: string; subtitle: string; empty: string }> = {
  hi: {
    breadcrumbHelp: "सहायता",
    breadcrumbFaq: "अक्सर पूछे जाने वाले प्रश्न",
    eyebrow: "सहायता",
    heading: "अक्सर पूछे जाने वाले प्रश्न",
    subtitle: "VoterSurvey.in का सर्वे, परिणाम, और गोपनीयता सुरक्षा कैसे काम करते हैं, इसके बारे में जो कुछ भी आप जानना चाहें।",
    empty: "अभी तक कोई प्रश्न प्रकाशित नहीं किए गए हैं।",
  },
  en: {
    breadcrumbHelp: "Help",
    breadcrumbFaq: "FAQ",
    eyebrow: "Support",
    heading: "Frequently Asked Questions",
    subtitle: "Everything you might want to know about how VoterSurvey.in's survey, results, and privacy protections work.",
    empty: "No published questions yet.",
  },
};

export const revalidate = 60;

export default async function FaqPage() {
  const locale = await getServerLocale();
  const categories = await loadPublishedFaqCategories(undefined, locale);
  const c = COPY[locale];

  // FAQPage structured data built from the exact same, exact-order data the
  // visible <FaqAccordion> renders below — never a hand-maintained duplicate
  // that could drift from what a visitor actually sees.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: categories.flatMap((category) =>
      category.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      }))
    ),
  };

  return (
    <Container className="max-w-3xl py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Breadcrumb items={[{ label: c.breadcrumbHelp }, { label: c.breadcrumbFaq }]} />
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">{c.eyebrow}</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{c.heading}</h1>
      <p className="mt-2 text-sm text-muted">{c.subtitle}</p>

      <div className="mt-8">
        {categories.length > 0 ? (
          <FaqAccordion categories={categories} />
        ) : (
          <p className="mt-8 text-sm text-muted">{c.empty}</p>
        )}
      </div>
    </Container>
  );
}
