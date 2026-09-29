import type { Metadata } from "next";
import Link from "next/link";
import { Info, TriangleAlert, ClipboardList, UserCheck, Database, ChartColumn, Users, ShieldCheck, ChartBar, Scale, Eye, ArrowRight, Megaphone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { MIN_ANALYTICS_GROUP_SIZE_DEFAULT } from "@/lib/enums";
import { buildPageMetadata } from "@/lib/seo";
import { resolveStaticSeoBase } from "@/lib/seo-catalog";
import { applySeoOverride } from "@/lib/seo-overrides";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import type { Locale } from "@/lib/i18n/LocaleProvider";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const base = resolveStaticSeoBase("methodology", locale);
  return applySeoOverride(buildPageMetadata({ title: base.title, description: base.description, path: base.path }), base.path);
}

function buildCopy(locale: Locale, minGroupSize: number) {
  const copy = {
    hi: {
      breadcrumb: "विधि / Methodology",
      eyebrow: "विधि / Methodology",
      heading: "हमारा सर्वेक्षण कैसे काम करता है?",
      description:
        "VoterSurvey.in एक सार्वजनिक सर्वेक्षण मंच है जहाँ लोग अपने राज्य, जिला और विधानसभा क्षेत्र के अनुसार विभिन्न मुद्दों पर अपनी राय साझा कर सकते हैं। इस पृष्ठ पर हम बताते हैं कि हमारा सर्वेक्षण कैसे काम करता है और परिणाम व विश्लेषण कैसे तैयार होते हैं।",
      infoCardTitle: "यह एक जनमत सर्वेक्षण मंच है",
      infoCardBody: "यह किसी भी सरकारी संस्था से संबद्ध नहीं है और यह आधिकारिक चुनाव परिणाम का प्रतिनिधित्व नहीं करता है।",
      warningCardTitle: "यह चुनाव परिणाम का दावा नहीं करता",
      warningCardBody: "यह प्लेटफ़ॉर्म केवल लोगों की राय जानने के लिए है। इसे किसी भी प्रकार के आधिकारिक चुनाव परिणाम के रूप में न देखें।",
      processHeading: "सर्वेक्षण प्रक्रिया (संक्षेप में)",
      steps: [
        { title: "प्रश्न और विकल्प", body: "विभिन्न मुद्दों पर तैयार प्रश्न और विकल्प प्रदान किए जाते हैं।" },
        { title: "आपकी राय", body: "लोग अपने क्षेत्र के अनुसार प्रश्नों के उत्तर देकर अपनी राय साझा करते हैं।" },
        { title: "डेटा संग्रह", body: "सभी उत्तर सुरक्षित रूप से एकत्र किए जाते हैं।" },
        { title: "परिणाम और विश्लेषण", body: "एकत्रित डेटा के आधार पर परिणाम और रुझान विश्लेषण प्रस्तुत किए जाते हैं।" },
      ],
      cards: [
        { title: "किससे भाग ले सकता है?", body: "कोई भी व्यक्ति अपने राज्य, जिला और विधानसभा क्षेत्र के अनुसार सर्वेक्षण में भाग ले सकता है।" },
        { title: "गोपनीयता", body: "आपकी व्यक्तिगत जानकारी सुरक्षित रखी जाती है। हम किसी भी उत्तरदाता की पहचान सार्वजनिक नहीं करते।" },
        {
          title: "डेटा का उपयोग",
          body: `एकत्रित डेटा का उपयोग केवल समग्र विश्लेषण के लिए किया जाता है। न्यूनतम ${minGroupSize} वैध प्रतिक्रियाओं से कम वाला कोई भी समूह सार्वजनिक रूप से नहीं दिखाया जाता।`,
        },
        { title: "सीमाएं", body: "यह एक स्वैच्छिक जनमत सर्वेक्षण है। यह किसी भी सरकारी संस्था से आधिकारिक रूप से संबद्ध नहीं है और इसे चुनाव परिणाम के रूप में नहीं देखा जाना चाहिए।" },
        { title: "पारदर्शिता", body: "हम पारदर्शी और निष्पक्ष तरीके से सर्वेक्षण डेटा प्रस्तुत करने का प्रयास करते हैं। पार्टी व उम्मीदवार क्रम कभी लोकप्रियता के अनुसार नहीं होता।" },
        { title: "अधिक जानकारी", body: "विस्तृत जानकारी के लिए आप हमारी गोपनीयता नीति, उपयोग की शर्तें और अस्वीकरण भी पढ़ सकते हैं।" },
      ],
      ctaTitle: "आप भी सर्वेक्षण में भाग लें",
      ctaBody: "अपने विधानसभा क्षेत्र के मुद्दों पर अपनी राय साझा करें और परिणाम व विश्लेषण देखें।",
      ctaButton: "अपना क्षेत्र चुनें",
    },
    en: {
      breadcrumb: "Methodology",
      eyebrow: "Methodology",
      heading: "How Our Survey Works",
      description:
        "VoterSurvey.in is a public survey platform where people can share their opinion on various issues by state, district, and assembly constituency. This page explains how our survey works and how results and analysis are produced.",
      infoCardTitle: "This Is a Public-Opinion Survey Platform",
      infoCardBody: "It is not affiliated with any government body and does not represent an official election result.",
      warningCardTitle: "This Does Not Claim to Be an Election Result",
      warningCardBody: "This platform exists only to gauge people's opinions. Do not treat it as any kind of official election result.",
      processHeading: "The Survey Process (In Brief)",
      steps: [
        { title: "Questions & Options", body: "Prepared questions and options are provided on various issues." },
        { title: "Your Opinion", body: "People share their opinion by answering questions specific to their constituency." },
        { title: "Data Collection", body: "All answers are collected securely." },
        { title: "Results & Analysis", body: "Results and trend analysis are presented based on the collected data." },
      ],
      cards: [
        { title: "Who Can Participate?", body: "Anyone can take part in the survey based on their state, district, and assembly constituency." },
        { title: "Privacy", body: "Your personal information is kept secure. We do not publicly disclose the identity of any respondent." },
        {
          title: "Use of Data",
          body: `Collected data is used only for aggregate analysis. Any group with fewer than ${minGroupSize} valid responses is not shown publicly.`,
        },
        { title: "Limitations", body: "This is a voluntary public-opinion survey. It is not officially affiliated with any government body and should not be viewed as an election result." },
        { title: "Transparency", body: "We aim to present survey data transparently and fairly. Party and candidate ordering is never based on popularity." },
        { title: "More Information", body: "For more details, you can also read our Privacy Policy, Terms of Use, and Disclaimer." },
      ],
      ctaTitle: "You Can Take the Survey Too",
      ctaBody: "Share your opinion on the issues in your assembly constituency and see the results and analysis.",
      ctaButton: "Choose Your Constituency",
    },
  } satisfies Record<Locale, unknown>;

  return copy[locale];
}

const STEP_ICONS = [ClipboardList, UserCheck, Database, ChartColumn] as const;
const STEP_COLORS = ["bg-blue-50 text-blue-600", "bg-green-50 text-green-600", "bg-purple-50 text-purple-600", "bg-orange-50 text-orange-600"] as const;

const CARD_ICONS = [Users, ShieldCheck, ChartBar, Scale, Eye, Info] as const;
const CARD_COLORS = [
  "bg-blue-50 text-blue-600",
  "bg-green-50 text-green-600",
  "bg-rose-50 text-rose-600",
  "bg-purple-50 text-purple-600",
  "bg-orange-50 text-orange-600",
  "bg-blue-50 text-blue-600",
] as const;

export default async function MethodologyPage() {
  const locale = await getServerLocale();
  const c = buildCopy(locale, MIN_ANALYTICS_GROUP_SIZE_DEFAULT);

  return (
    <Container className="max-w-6xl py-10 sm:py-14">
      <Breadcrumb items={[{ label: c.breadcrumb }]} />

      {/* Hero */}
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">{c.eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl lg:text-[42px]">
            {c.heading}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/80 sm:text-base">{c.description}</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-blue-50/60 p-5 shadow-[var(--shadow-card)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Info size={18} />
            </div>
            <h2 className="mt-3 font-display text-sm font-bold text-ink">{c.infoCardTitle}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{c.infoCardBody}</p>
          </div>

          <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <TriangleAlert size={18} />
            </div>
            <h2 className="mt-3 font-display text-sm font-bold text-ink">{c.warningCardTitle}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{c.warningCardBody}</p>
          </div>
        </div>
      </section>

      {/* Survey process */}
      <section className="mt-10 sm:mt-12">
        <h2 className="font-display text-lg font-bold text-ink">{c.processHeading}</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-4 lg:gap-3">
          {c.steps.map((step, i) => (
            <div key={step.title} className="flex items-center gap-3 lg:flex-col lg:items-stretch lg:gap-0">
              <div className="flex-1 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${STEP_COLORS[i]}`}>
                    {(() => {
                      const Icon = STEP_ICONS[i];
                      return <Icon size={17} />;
                    })()}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-sm font-bold text-ink">{step.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-foreground/80">{step.body}</p>
              </div>
              {i < c.steps.length - 1 && (
                <div className="hidden shrink-0 items-center justify-center py-1 lg:flex" aria-hidden="true">
                  <ArrowRight size={16} className="text-blue-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Info card grid */}
      <section className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
        {c.cards.map((card, i) => {
          const Icon = CARD_ICONS[i];
          return (
            <div key={card.title} className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${CARD_COLORS[i]}`}>
                <Icon size={19} />
              </span>
              <h3 className="mt-3 font-display text-sm font-bold text-ink">{card.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{card.body}</p>
            </div>
          );
        })}
      </section>

      {/* CTA */}
      <section className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-blue-50/60 p-6 sm:mt-12 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Megaphone size={20} />
          </span>
          <div>
            <h2 className="font-display text-sm font-bold text-ink">{c.ctaTitle}</h2>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-foreground/80">{c.ctaBody}</p>
          </div>
        </div>
        <Link
          href="/find-constituency"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(234,88,12,0.45)] transition-colors hover:bg-orange-700"
        >
          {c.ctaButton}
          <ArrowRight size={16} />
        </Link>
      </section>
    </Container>
  );
}
