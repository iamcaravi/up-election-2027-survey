import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
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

const CONTACT_CATEGORIES: Record<Locale, { title: string; body: string }[]> = {
  hi: [
    {
      title: "सामान्य पूछताछ",
      body: "VoterSurvey.in, यह मंच कैसे काम करता है, या नीचे दी गई श्रेणियों में शामिल न होने वाले किसी भी प्रश्न के बारे में।",
    },
    {
      title: "सर्वे / डेटा संबंधी प्रश्न",
      body: "किसी विशेष सर्वे, किसी परिणाम या प्रतिशत की गणना कैसे हुई, या विधानसभा क्षेत्र-स्तरीय डेटा कैसे दिखाया जाता है, इस बारे में प्रश्न।",
    },
    {
      title: "तकनीकी सहायता",
      body: "कोई पेज सही से लोड न होना, कोई टूटा हुआ लिंक, या वेबसाइट पर कोई अप्रत्याशित व्यवहार।",
    },
    {
      title: "गोपनीयता / डेटा अनुरोध",
      body: "कौन-सा डेटा एकत्र किया जाता है, या आपसे संबंधित जानकारी को लेकर कोई अनुरोध। क्या एकत्र किया जाता है (और क्या नहीं), इसके विवरण के लिए हमारी गोपनीयता नीति देखें।",
    },
    {
      title: "चुनाव / नियामक संचार",
      body: "भारत निर्वाचन आयोग, किसी राज्य निर्वाचन आयोग, या किसी अन्य सक्षम प्राधिकरण से इस वेबसाइट या इसकी सामग्री के संबंध में संचार। मंच के नियामक सहयोग खंड के लिए हमारा अस्वीकरण देखें।",
    },
  ],
  en: [
    {
      title: "General Enquiries",
      body: "Questions about VoterSurvey.in, how the platform works, or anything not covered by the categories below.",
    },
    {
      title: "Survey / Data Questions",
      body: "Questions about a specific survey, how a result or percentage was calculated, or how constituency-level data is shown.",
    },
    {
      title: "Technical Support",
      body: "A page not loading correctly, a broken link, or unexpected behaviour on the website.",
    },
    {
      title: "Privacy / Data Requests",
      body: "Questions about what data is collected, or a request relating to information you believe concerns you. See our Privacy Policy for details on what is (and isn't) collected.",
    },
    {
      title: "Election / Regulatory Communication",
      body: "Communication from the Election Commission of India, a State Election Commission, or another competent authority regarding this website or its content. See our Disclaimer for the platform's regulatory cooperation clause.",
    },
  ],
};

const COPY = {
  hi: {
    breadcrumbHelp: "सहायता",
    breadcrumbContact: "संपर्क करें",
    eyebrow: "सहायता",
    heading: "संपर्क करें",
    intro:
      "VoterSurvey.in एक स्वतंत्र, स्वैच्छिक जनमत सर्वे मंच है। यह भारत निर्वाचन आयोग या किसी राज्य निर्वाचन आयोग से — जब तक स्पष्ट रूप से न कहा जाए — संबद्ध, संचालित, अनुमोदित या आधिकारिक रूप से जुड़ा नहीं है, और यह किसी भी राजनीतिक दल या उम्मीदवार से भी संबद्ध नहीं है।",
    emailUs: "हमें ईमेल करें",
    helpHeading: "हम किस चीज़ में मदद कर सकते हैं?",
    footer: "हम वास्तविक पूछताछ का उचित समय में जवाब देने का प्रयास करते हैं। कृपया पर्याप्त विवरण शामिल करें (जैसे पेज URL, राज्य/विधानसभा क्षेत्र, या स्क्रीनशॉट) ताकि हम जल्दी जांच कर सकें।",
  },
  en: {
    breadcrumbHelp: "Help",
    breadcrumbContact: "Contact Us",
    eyebrow: "Support",
    heading: "Contact Us",
    intro:
      "VoterSurvey.in is an independent, voluntary public-opinion survey platform. It is not affiliated with, operated by, endorsed by, or officially associated with the Election Commission of India or any State Election Commission unless explicitly stated otherwise, and is not affiliated with any political party or candidate.",
    emailUs: "Email us",
    helpHeading: "What can we help with?",
    footer: "We aim to respond to genuine enquiries in a reasonable time. Please include enough detail (e.g. the page URL, state/constituency, or a screenshot) so we can look into it quickly.",
  },
};

export default async function ContactPage() {
  const locale = await getServerLocale();
  const { contactEmail: CONTACT_EMAIL } = await getSiteBranding();
  const c = COPY[locale];
  const categories = CONTACT_CATEGORIES[locale];

  return (
    <Container className="max-w-3xl py-14">
      <Breadcrumb items={[{ label: c.breadcrumbHelp }, { label: c.breadcrumbContact }]} />
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">{c.eyebrow}</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{c.heading}</h1>

      <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p>{c.intro}</p>
      </div>

      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4 shadow-[var(--shadow-card)] transition-colors hover:border-accent"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Mail size={20} />
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wide text-muted">{c.emailUs}</span>
          <span className="block truncate font-display text-lg font-bold text-ink">{CONTACT_EMAIL}</span>
        </span>
      </a>

      <div className="mt-10">
        <h2 className="font-display text-lg font-bold text-foreground">{c.helpHeading}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {categories.map((cat) => (
            <div key={cat.title} className="rounded-xl border border-border bg-surface p-4">
              <p className="font-display text-sm font-bold text-foreground">{cat.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{cat.body}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-8 text-xs leading-relaxed text-muted">{c.footer}</p>
    </Container>
  );
}
