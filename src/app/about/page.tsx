import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  Target,
  Shield,
  ChartColumn,
  Lock,
  BookOpen,
  ArrowRight,
  Info,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { buildPageMetadata } from "@/lib/seo";
import { resolveStaticSeoBase } from "@/lib/seo-catalog";
import { applySeoOverride } from "@/lib/seo-overrides";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import type { Locale } from "@/lib/i18n/LocaleProvider";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const base = resolveStaticSeoBase("about", locale);
  return applySeoOverride(
    buildPageMetadata({ title: base.title, description: base.description, path: base.path }),
    base.path
  );
}

const CARD_ICONS = [Users, Target, Shield, ChartColumn, Lock, BookOpen] as const;
const CARD_COLORS = [
  "bg-blue-50 text-blue-600",
  "bg-orange-50 text-orange-600",
  "bg-green-50 text-green-600",
  "bg-purple-50 text-purple-600",
  "bg-rose-50 text-rose-600",
  "bg-blue-50 text-blue-600",
] as const;

const COPY: Record<
  Locale,
  {
    breadcrumb: string;
    eyebrow: string;
    heading: string;
    description: string;
    ctaSurvey: string;
    ctaResults: string;
    infoTitle: string;
    infoBody: string;
    cards: { title: string; body: string }[];
    infoFooterTitle: string;
    infoFooterBody: string;
    infoFooterCta: string;
  }
> = {
  hi: {
    breadcrumb: "हमारे बारे में",
    eyebrow: "हमारे बारे में",
    heading: "जनता का मंच, राजनीति का नहीं",
    description:
      "votersurvey.in एक स्वतंत्र और निष्पक्ष मंच है जो हर भारतीय नागरिक को आवाज़ देता है। हमारा मानना है कि लोकतंत्र तभी सशक्त होता है जब लोग जागरूक, सूचित हों और लोकतांत्रिक प्रक्रिया में सक्रिय भागीदारी करें।",
    ctaSurvey: "सर्वे में भाग लें",
    ctaResults: "परिणाम देखें",
    infoTitle: "100% स्वतंत्र और निष्पक्ष",
    infoBody:
      "यह मंच किसी भी राजनीतिक दल, उम्मीदवार या भारत निर्वाचन आयोग से संबद्ध नहीं है। यहां दिखाए गए परिणाम केवल स्वैच्छिक सर्वे प्रतिभागियों की राय पर आधारित हैं।",
    cards: [
      {
        title: "हमारा मंच",
        body: "यह एक स्वतंत्र सार्वजनिक सर्वे मंच है जो हर नागरिक को अपनी राजनीतिक राय व्यक्त करने और वास्तविक जनमत को समझने का एक सुरक्षित तरीका देता है।",
      },
      {
        title: "हमारा उद्देश्य",
        body: "हर नागरिक को अपनी राय व्यक्त करने, वास्तविक डेटा को समझने और एक सशक्त, जागरूक लोकतंत्र के निर्माण में योगदान के लिए एक सुरक्षित, पारदर्शी और निष्पक्ष मंच प्रदान करना।",
      },
      {
        title: "पूर्णतः निष्पक्ष",
        body: "votersurvey.in किसी भी राजनीतिक दल से असंबद्ध है। मंच पर दिखाए गए आंकड़े किसी दल या उम्मीदवार के पक्ष या विपक्ष में नहीं होते।",
      },
      {
        title: "डेटा आधारित निष्कर्ष",
        body: "हर परिणाम वास्तविक, स्वैच्छिक सर्वे प्रतिक्रियाओं पर आधारित है — कोई अनुमान या भविष्यवाणी नहीं, केवल सत्यापित वास्तविक जनमत।",
      },
      {
        title: "गोपनीयता व सुरक्षा",
        body: "आपका डेटा सुरक्षित और गोपनीय रखा जाता है। व्यक्तिगत प्रतिक्रियाएं कभी सार्वजनिक या प्रकाशित नहीं की जातीं — केवल समग्र आंकड़े दिखाए जाते हैं।",
      },
      {
        title: "हमारी कहानी",
        body: "votersurvey.in की स्थापना एक सरल विचार के साथ हुई — एक ऐसा निष्पक्ष मंच बनाना जहाँ महानगरों से लेकर छोटे कस्बों तक का हर भारतीय बिना किसी डर या पूर्वाग्रह के अपनी बात रख सके।",
      },
    ],
    infoFooterTitle: "अधिक जानकारी के लिए",
    infoFooterBody: "यदि आपके कोई प्रश्न हैं या आप हमारी कार्यपद्धति के बारे में अधिक जानना चाहते हैं, तो आप हमसे संपर्क कर सकते हैं।",
    infoFooterCta: "संपर्क करें",
  },
  en: {
    breadcrumb: "About Us",
    eyebrow: "About Us",
    heading: "A Platform for People, Not Politics",
    description:
      "Votersurvey.in is an independent, non-partisan platform that gives every Indian a voice. We believe a stronger democracy is built when people are informed, aware, and actively participate in the political process.",
    ctaSurvey: "Take Survey Now",
    ctaResults: "Explore Results",
    infoTitle: "100% Independent & Non-Partisan",
    infoBody:
      "This platform is not affiliated with any political party, candidate, or the Election Commission of India. Results shown here reflect only voluntary survey participants' opinions.",
    cards: [
      {
        title: "Our Platform",
        body: "An independent public survey platform that gives every citizen a safe way to express their political opinion and understand real public sentiment.",
      },
      {
        title: "Our Mission",
        body: "To empower every citizen with a safe, transparent, and non-partisan platform to express their political opinions, explore real-time insights, and contribute to a more informed and participative democracy.",
      },
      {
        title: "Fully Non-Partisan",
        body: "Votersurvey.in has no affiliation with any political party. Figures shown on the platform never favour or oppose any party or candidate.",
      },
      {
        title: "Data-Driven Insights",
        body: "Every result is based on real, voluntary survey responses — no guesswork or prediction, only verified real public opinion.",
      },
      {
        title: "Privacy & Security",
        body: "Your data is kept safe and anonymous. Individual responses are never published — only aggregate figures are shown publicly.",
      },
      {
        title: "Our Story",
        body: "Votersurvey.in was founded with a simple idea — to create a neutral platform where every Indian, from metro cities to small towns, can share their political views without fear or bias.",
      },
    ],
    infoFooterTitle: "For More Information",
    infoFooterBody: "If you have any questions or want to learn more about our methodology, you can get in touch with us.",
    infoFooterCta: "Contact Us",
  },
};

export default async function AboutPage() {
  const locale = await getServerLocale();
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
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/find-constituency"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(234,88,12,0.45)] transition-colors hover:bg-orange-700"
            >
              {c.ctaSurvey}
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/results"
              className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-ink/20 bg-white px-5 text-sm font-bold text-ink transition-colors hover:border-ink/40"
            >
              <ChartColumn size={16} />
              {c.ctaResults}
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-blue-50/60 p-5 shadow-[var(--shadow-card)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Info size={20} />
          </div>
          <h2 className="mt-3 font-display text-base font-bold text-ink">{c.infoTitle}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{c.infoBody}</p>
        </div>
      </section>

      {/* Numbered feature grid */}
      <section className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
        {c.cards.map((card, i) => {
          const Icon = CARD_ICONS[i];
          return (
            <div key={card.title} className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-bold text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${CARD_COLORS[i]}`}>
                  <Icon size={19} />
                </span>
              </div>
              <h3 className="mt-3 font-display text-sm font-bold text-ink">{card.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{card.body}</p>
            </div>
          );
        })}
      </section>

      {/* Bottom info CTA */}
      <section className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-blue-50/60 p-6 sm:mt-12 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Info size={20} />
          </span>
          <div>
            <h2 className="font-display text-sm font-bold text-ink">{c.infoFooterTitle}</h2>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-foreground/80">{c.infoFooterBody}</p>
          </div>
        </div>
        <Link
          href="/contact"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(234,88,12,0.45)] transition-colors hover:bg-orange-700"
        >
          {c.infoFooterCta}
          <ArrowRight size={16} />
        </Link>
      </section>
    </Container>
  );
}
