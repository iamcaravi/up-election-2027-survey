import type { Metadata } from "next";
import { Info } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { FaqExplorer } from "@/components/faq/FaqExplorer";
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

const COPY: Record<Locale, { breadcrumb: string; eyebrow: string; heading: string; subtitle: string; empty: string; heroCardTitle: string; heroCardBody: string }> = {
  hi: {
    breadcrumb: "सामान्य प्रश्न",
    eyebrow: "सामान्य प्रश्न (FAQ)",
    heading: "अक्सर पूछे जाने वाले प्रश्न",
    subtitle: "यहां आपको VoterSurvey.in से जुड़े आम सवालों के जवाब मिलेंगे। यदि आपको यहां उत्तर नहीं मिलता, तो आप हमसे संपर्क कर सकते हैं।",
    empty: "अभी तक कोई प्रश्न प्रकाशित नहीं किए गए हैं।",
    heroCardTitle: "आपका सवाल यहां नहीं मिला?",
    heroCardBody: "हमसे संपर्क करें, हमें आपकी मदद करने में खुशी होगी।",
  },
  en: {
    breadcrumb: "FAQ",
    eyebrow: "FAQ",
    heading: "Frequently Asked Questions",
    subtitle: "Here you'll find answers to common questions about VoterSurvey.in. If you don't find your answer here, you can contact us.",
    empty: "No published questions yet.",
    heroCardTitle: "Couldn't find your question?",
    heroCardBody: "Get in touch with us — we'd be happy to help.",
  },
};

export const revalidate = 60;

export default async function FaqPage() {
  const locale = await getServerLocale();
  const categories = await loadPublishedFaqCategories(undefined, locale);
  const c = COPY[locale];

  // FAQPage structured data built from the exact same, exact-order data the
  // visible <FaqExplorer> renders below — never a hand-maintained duplicate
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
    <Container className="max-w-6xl py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Breadcrumb items={[{ label: c.breadcrumb }]} />

      {/* Hero */}
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">{c.eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl lg:text-[42px]">
            {c.heading}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/80 sm:text-base">{c.subtitle}</p>
        </div>

        <div className="rounded-2xl border border-border bg-blue-50/60 p-5 shadow-[var(--shadow-card)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Info size={20} />
          </div>
          <h2 className="mt-3 font-display text-base font-bold text-ink">{c.heroCardTitle}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{c.heroCardBody}</p>
        </div>
      </section>

      <div className="mt-8 sm:mt-10">
        {categories.length > 0 ? (
          <FaqExplorer categories={categories} locale={locale} />
        ) : (
          <p className="mt-8 text-sm text-muted">{c.empty}</p>
        )}
      </div>
    </Container>
  );
}
