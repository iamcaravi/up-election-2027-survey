import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { FAQ_CATEGORIES } from "@/lib/faq-data";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Frequently Asked Questions",
  description:
    "Answers about how VoterSurvey.in's survey works, how results and issue percentages are calculated, privacy protections, and the platform's relationship with the Election Commission of India.",
  path: "/faq",
});

export default function FaqPage() {
  // FAQPage structured data built from the exact same FAQ_CATEGORIES array
  // the visible <FaqAccordion> renders below — never a hand-maintained
  // duplicate that could drift from what a visitor actually sees.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_CATEGORIES.flatMap((category) =>
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
      <Breadcrumb items={[{ label: "Help" }, { label: "FAQ" }]} />
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Support</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Frequently Asked Questions</h1>
      <p className="mt-2 text-sm text-muted">
        Everything you might want to know about how VoterSurvey.in&apos;s survey, results, and privacy protections
        work.
      </p>

      <div className="mt-8">
        <FaqAccordion categories={FAQ_CATEGORIES} />
      </div>
    </Container>
  );
}
