import type { Metadata } from "next";
import Link from "next/link";
import { Users, ShieldCheck, Scale, FileBarChart } from "lucide-react";
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
  return applySeoOverride(buildPageMetadata({ title: base.title, description: base.description, path: base.path }), base.path);
}

const PRINCIPLES: Record<Locale, { icon: typeof Users; title: string; text: string }[]> = {
  hi: [
    { icon: Users, title: "जनता की भागीदारी", text: "कोई भी अपने विधानसभा क्षेत्र के सर्वे में स्वेच्छा से भाग ले सकता है।" },
    { icon: ShieldCheck, title: "गोपनीयता और सुरक्षा", text: "नाम, फोन नंबर, ईमेल या किसी सरकारी पहचान की मांग नहीं की जाती।" },
    { icon: Scale, title: "राजनीतिक स्वतंत्रता", text: "यह मंच किसी भी राजनीतिक दल, उम्मीदवार या सरकार से संबद्ध नहीं है।" },
    { icon: FileBarChart, title: "तथ्य आधारित विश्लेषण", text: "परिणाम केवल सत्यापित प्रतिक्रियाओं के आधार पर पारदर्शी तरीके से दिखाए जाते हैं।" },
  ],
  en: [
    { icon: Users, title: "Public participation", text: "Anyone can voluntarily take part in their assembly constituency's survey." },
    { icon: ShieldCheck, title: "Privacy and security", text: "We do not ask for your name, phone number, email, or any government ID." },
    { icon: Scale, title: "Political independence", text: "This platform is not affiliated with any political party, candidate, or government." },
    { icon: FileBarChart, title: "Fact-based analysis", text: "Results are shown transparently, based only on verified responses." },
  ],
};

const COPY = {
  hi: {
    breadcrumbHelp: "सहायता",
    breadcrumbAbout: "हमारे बारे में",
    eyebrow: "हमारे बारे में",
    p1: (
      <>
        देश के लोकतंत्र को और अधिक मजबूत बनाने के लिए जनता की राय को एक विश्वसनीय और पारदर्शी मंच प्रदान करना — यही
        votersurvey.in का उद्देश्य है। हम किसी भी राजनीतिक दल से स्वतंत्र हैं और तथ्यों पर आधारित विश्लेषण में
        विश्वास रखते हैं।
      </>
    ),
    p2: (
      <>
        यह एक स्वैच्छिक, ऑनलाइन जनमत सर्वे है — इसका किसी चुनाव के आधिकारिक परिणाम से कोई संबंध नहीं है। हर सर्वे
        स्वतंत्र रूप से भरा जाता है और परिणाम केवल सर्वे में भाग लेने वाले लोगों की राय दर्शाते हैं, संपूर्ण मतदाताओं
        की नहीं। विस्तृत जानकारी के लिए हमारी{" "}
        <Link href="/methodology" className="font-semibold text-accent hover:underline">
          पद्धति
        </Link>{" "}
        देखें।
      </>
    ),
  },
  en: {
    breadcrumbHelp: "Help",
    breadcrumbAbout: "About Us",
    eyebrow: "About Us",
    p1: (
      <>
        votersurvey.in exists to give the public a trustworthy, transparent platform for their opinion — to help
        strengthen the country&apos;s democracy. We are independent of any political party and believe in fact-based
        analysis.
      </>
    ),
    p2: (
      <>
        This is a voluntary, online public-opinion survey — it has no connection to any election&apos;s official
        result. Every survey is filled out independently, and results reflect only the opinions of respondents who
        took part, not the entire electorate. See our{" "}
        <Link href="/methodology" className="font-semibold text-accent hover:underline">
          methodology
        </Link>{" "}
        for details.
      </>
    ),
  },
};

export default async function AboutPage() {
  const locale = await getServerLocale();
  const c = COPY[locale];
  const principles = PRINCIPLES[locale];

  return (
    <Container className="max-w-3xl py-14">
      <Breadcrumb items={[{ label: c.breadcrumbHelp }, { label: c.breadcrumbAbout }]} />
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">{c.eyebrow}</p>
      <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">votersurvey.in</h1>

      <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p>{c.p1}</p>
        <p>{c.p2}</p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {principles.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.title} className="flex gap-3 rounded-xl border border-border bg-surface p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink/10 text-ink dark:bg-white/10 dark:text-white">
                <Icon size={18} />
              </span>
              <div>
                <p className="font-display text-sm font-bold text-foreground">{p.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{p.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Container>
  );
}
