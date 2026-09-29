import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Clock, Lightbulb, TriangleAlert, Info, Handshake, CircleQuestionMark, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ContactForm } from "@/components/contact/ContactForm";
import { buildPageMetadata } from "@/lib/seo";
import { getSiteBranding } from "@/lib/site-branding";
import { resolveStaticSeoBase } from "@/lib/seo-catalog";
import { applySeoOverride } from "@/lib/seo-overrides";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import type { Locale } from "@/lib/i18n/LocaleProvider";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const base = resolveStaticSeoBase("contact", locale);
  return applySeoOverride(buildPageMetadata({ title: base.title, description: base.description, path: base.path }), base.path);
}

const TOPIC_ICONS = [Lightbulb, TriangleAlert, Info, Handshake] as const;
const TOPIC_COLORS = [
  "bg-blue-50 text-blue-600",
  "bg-rose-50 text-rose-600",
  "bg-sky-50 text-sky-600",
  "bg-purple-50 text-purple-600",
] as const;

const COPY = {
  hi: {
    breadcrumb: "संपर्क करें",
    eyebrow: "संपर्क करें",
    heading: "हमसे संपर्क करें",
    description:
      "यदि आपके कोई प्रश्न, सुझाव या किसी भी प्रकार की सहायता की आवश्यकता है तो आप हमसे संपर्क कर सकते हैं। हम आपके संदेश का यथाशीघ्र उत्तर देने का प्रयास करेंगे।",
    heroCardTitle: "आपकी राय हमारे लिए महत्वपूर्ण है",
    heroCardBody: "आपके सुझाब और प्रतिक्रिया से हमें बेहतर मंच बनाने में मदद मिलती है।",
    contactInfoHeading: "संपर्क जानकारी",
    emailLabel: "ईमेल",
    responseTimeTitle: "उत्तर देने का समय",
    responseTimeBody: "हम आपके संदेश का यथाशीघ्र उत्तर देने का प्रयास करते हैं। कृपया धैर्य रखें।",
    topicsHeading: "जिन विषयों पर आप लिख सकते हैं",
    topics: [
      { title: "सुझाव", body: "वेबसाइट को बेहतर बनाने के लिए सुझाव दें।" },
      { title: "समस्या रिपोर्ट करें", body: "यदि आपको किसी तकनीकी समस्या का सामना करना पड़ रहा है।" },
      { title: "सामान्य जानकारी", body: "सर्वेक्षण, परिणाम या अन्य जानकारी के बारे में।" },
      { title: "सहयोग / साझेदारी", body: "सहयोग या अन्य संभावनाओं के लिए संपर्क करें।" },
    ],
    subjectOptions: ["सुझाव", "समस्या रिपोर्ट करें", "सामान्य जानकारी", "गोपनीयता / डेटा अनुरोध", "चुनाव / नियामक संचार", "सहयोग / साझेदारी"],
    helpCtaTitle: "अभी भी कोई प्रश्न है?",
    helpCtaBody: "पहले हमारे सामान्य प्रश्न (FAQ) या मदद पेज पर देखें। वहां आपको कई आम सवालों के जवाब मिल सकते हैं।",
    helpCtaHelp: "मदद देखें",
    helpCtaFaq: "FAQ देखें",
  },
  en: {
    breadcrumb: "Contact Us",
    eyebrow: "Contact Us",
    heading: "Get in Touch",
    description:
      "If you have any questions, suggestions, or need help of any kind, you can reach out to us. We try to respond to messages as soon as possible.",
    heroCardTitle: "Your feedback matters to us",
    heroCardBody: "Your suggestions and feedback help us build a better platform.",
    contactInfoHeading: "Contact Information",
    emailLabel: "Email",
    responseTimeTitle: "Response Time",
    responseTimeBody: "We try to respond to your message as soon as possible. Please be patient.",
    topicsHeading: "Topics You Can Write About",
    topics: [
      { title: "Suggestion", body: "Share suggestions to help us improve the website." },
      { title: "Report an Issue", body: "If you're facing a technical problem." },
      { title: "General Information", body: "About the survey, results, or other information." },
      { title: "Collaboration / Partnership", body: "Reach out for collaboration or other opportunities." },
    ],
    subjectOptions: ["Suggestion", "Report an Issue", "General Information", "Privacy / Data Request", "Election / Regulatory Communication", "Collaboration / Partnership"],
    helpCtaTitle: "Still have a question?",
    helpCtaBody: "Check our FAQ or Help page first — you may find the answer to many common questions there.",
    helpCtaHelp: "View Help",
    helpCtaFaq: "View FAQ",
  },
} satisfies Record<Locale, unknown>;

export default async function ContactPage() {
  const locale = await getServerLocale();
  const { contactEmail: CONTACT_EMAIL } = await getSiteBranding();
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
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/80 sm:text-base">{c.description}</p>
        </div>

        <div className="rounded-2xl border border-border bg-blue-50/60 p-5 shadow-[var(--shadow-card)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Mail size={20} />
          </div>
          <h2 className="mt-3 font-display text-base font-bold text-ink">{c.heroCardTitle}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{c.heroCardBody}</p>
        </div>
      </section>

      {/* Main content: info + form */}
      <section className="mt-10 grid gap-6 sm:mt-12 lg:grid-cols-2 lg:gap-8">
        {/* Left column */}
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">{c.contactInfoHeading}</h2>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4 shadow-[var(--shadow-card)] transition-colors hover:border-accent"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Mail size={20} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-wide text-muted">{c.emailLabel}</span>
                <span className="block truncate font-display text-base font-bold text-ink">{CONTACT_EMAIL}</span>
              </span>
            </a>

            <div className="mt-3 flex items-start gap-3 rounded-2xl border border-border bg-blue-50/60 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Clock size={17} />
              </span>
              <div>
                <p className="font-display text-sm font-bold text-ink">{c.responseTimeTitle}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">{c.responseTimeBody}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-ink">{c.topicsHeading}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {c.topics.map((topic, i) => {
                const Icon = TOPIC_ICONS[i];
                return (
                  <div key={topic.title} className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${TOPIC_COLORS[i]}`}>
                      <Icon size={17} />
                    </span>
                    <p className="mt-2.5 font-display text-sm font-bold text-foreground">{topic.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{topic.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: form */}
        <ContactForm locale={locale} contactEmail={CONTACT_EMAIL} subjectOptions={c.subjectOptions} />
      </section>

      {/* Help CTA */}
      <section className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-blue-50/60 p-6 sm:mt-12 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <CircleQuestionMark size={20} />
          </span>
          <div>
            <h2 className="font-display text-sm font-bold text-ink">{c.helpCtaTitle}</h2>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-foreground/80">{c.helpCtaBody}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/help"
            className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-ink/20 bg-white px-5 text-sm font-bold text-ink transition-colors hover:border-ink/40"
          >
            {c.helpCtaHelp}
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/faq"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-bold text-white transition-colors hover:bg-ink-2"
          >
            {c.helpCtaFaq}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </Container>
  );
}
