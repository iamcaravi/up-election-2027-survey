import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { loadPublishedFaqCategories } from "@/lib/faq-content";
import { buildPageMetadata } from "@/lib/seo";
import { resolveStaticSeoBase } from "@/lib/seo-catalog";
import { applySeoOverride } from "@/lib/seo-overrides";

export async function generateMetadata(): Promise<Metadata> {
  const base = resolveStaticSeoBase("faq");
  return applySeoOverride(buildPageMetadata({ title: base.title, description: base.description, path: base.path }), base.path);
}

export const revalidate = 60;

export default async function FaqPage() {
  const categories = await loadPublishedFaqCategories();

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
      <Breadcrumb items={[{ label: "Help" }, { label: "FAQ" }]} />
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Support</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Frequently Asked Questions</h1>
      <p className="mt-2 text-sm text-muted">
        Everything you might want to know about how VoterSurvey.in&apos;s survey, results, and privacy protections
        work.
      </p>

      <div className="mt-8">
        {categories.length > 0 ? (
          <FaqAccordion categories={categories} />
        ) : (
          <p className="mt-8 text-sm text-muted">No published questions yet.</p>
        )}
      </div>
    </Container>
  );
}
