import type { Metadata } from "next";
import Link from "next/link";
import { CircleQuestionMark, ArrowRight, BookOpen } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { HelpSearch } from "@/components/help/HelpSearch";
import { getHelpTopics } from "@/components/help/topics";
import { loadPublishedFaqCategories } from "@/lib/faq-content";
import { buildPageMetadata } from "@/lib/seo";
import { resolveStaticSeoBase } from "@/lib/seo-catalog";
import { applySeoOverride } from "@/lib/seo-overrides";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import type { Locale } from "@/lib/i18n/LocaleProvider";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const base = resolveStaticSeoBase("help", locale);
  return applySeoOverride(buildPageMetadata({ title: base.title, description: base.description, path: base.path }), base.path);
}

const COPY: Record<
  Locale,
  {
    breadcrumb: string;
    eyebrow: string;
    heading: string;
    subtitle: string;
    heroCardTitle: string;
    heroCardBody: string;
    heroCardCta: string;
    topicsHeading: string;
    faqHeading: string;
    stillNeedHelp: string;
    stillNeedHelpBody: string;
    contactCta: string;
    faqCta: string;
    methodologyCta: string;
  }
> = {
  hi: {
    breadcrumb: "मदद",
    eyebrow: "मदद",
    heading: "हम आपकी कैसे मदद कर सकते हैं?",
    subtitle: "यहां आपको VoterSurvey.in से जुड़ी सभी महत्वपूर्ण जानकारी, उपयोग करने के तरीके और आम समस्याओं के समाधान मिलेंगे।",
    heroCardTitle: "अभी भी कोई सवाल है?",
    heroCardBody: "आप हमारे संपर्क पेज के माध्यम से हमसे सीधे संपर्क कर सकते हैं।",
    heroCardCta: "संपर्क करें",
    topicsHeading: "लोकप्रिय विषय",
    faqHeading: "अक्सर पूछे जाने वाले प्रश्न",
    stillNeedHelp: "अभी भी मदद चाहिए?",
    stillNeedHelpBody: "यदि आपको यहां उत्तर नहीं मिला, तो आप हमसे सीधे संपर्क कर सकते हैं।",
    contactCta: "संपर्क करें",
    faqCta: "सामान्य प्रश्न (FAQ)",
    methodologyCta: "विधि / Methodology",
  },
  en: {
    breadcrumb: "Help",
    eyebrow: "Help",
    heading: "How Can We Help You?",
    subtitle: "Here you'll find all the important information about VoterSurvey.in, how to use it, and solutions to common issues.",
    heroCardTitle: "Still have a question?",
    heroCardBody: "You can reach us directly through our Contact page.",
    heroCardCta: "Contact Us",
    topicsHeading: "Popular Topics",
    faqHeading: "Frequently Asked Questions",
    stillNeedHelp: "Still need help?",
    stillNeedHelpBody: "If you didn't find your answer here, you can reach out to us directly.",
    contactCta: "Contact Us",
    faqCta: "FAQ",
    methodologyCta: "Methodology",
  },
};

export const revalidate = 60;

export default async function HelpPage() {
  const locale = await getServerLocale();
  const categories = await loadPublishedFaqCategories(undefined, locale);
  const topics = getHelpTopics(locale);
  const c = COPY[locale];

  return (
    <Container className="max-w-6xl py-10 sm:py-14">
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
            <CircleQuestionMark size={20} />
          </div>
          <h2 className="mt-3 font-display text-base font-bold text-ink">{c.heroCardTitle}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{c.heroCardBody}</p>
          <Link
            href="/contact"
            className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-orange-600 px-4 text-xs font-bold text-white transition-colors hover:bg-orange-700"
          >
            {c.heroCardCta}
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Search */}
      <section className="mt-8 sm:mt-10">
        <HelpSearch faqCategories={categories} locale={locale} />
      </section>

      {/* Popular topics */}
      <section className="mt-8 sm:mt-10">
        <h2 className="font-display text-lg font-bold text-ink">{c.topicsHeading}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.title}
                href={t.href}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] transition-colors hover:border-accent/40"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.color}`}>
                  <Icon size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-sm font-bold text-foreground">{t.title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">{t.description}</span>
                </span>
                <ArrowRight size={16} className="mt-1 shrink-0 text-muted" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* FAQ + support sidebar */}
      <section className="mt-10 grid gap-8 sm:mt-12 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">{c.faqHeading}</h2>
          <div className="mt-3">
            {categories.length > 0 ? <FaqAccordion categories={categories} /> : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-blue-50/60 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <CircleQuestionMark size={17} />
            </span>
            <p className="mt-2.5 font-display text-sm font-bold text-ink">{c.stillNeedHelp}</p>
            <p className="mt-1 text-xs leading-relaxed text-foreground/80">{c.stillNeedHelpBody}</p>
            <Link
              href="/contact"
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-orange-600 px-4 text-xs font-bold text-white transition-colors hover:bg-orange-700"
            >
              {c.contactCta}
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid gap-2.5">
            <Link
              href="/faq"
              className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-bold text-foreground shadow-[var(--shadow-card)] transition-colors hover:border-accent/40"
            >
              <CircleQuestionMark size={16} className="text-accent" />
              {c.faqCta}
            </Link>
            <Link
              href="/methodology"
              className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-bold text-foreground shadow-[var(--shadow-card)] transition-colors hover:border-accent/40"
            >
              <BookOpen size={16} className="text-accent" />
              {c.methodologyCta}
            </Link>
          </div>
        </div>
      </section>
    </Container>
  );
}
