import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { buildPageMetadata } from "@/lib/seo";
import { resolveStaticSeoBase } from "@/lib/seo-catalog";
import { applySeoOverride } from "@/lib/seo-overrides";
import { getServerLocale } from "@/lib/i18n/locale-cookie";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const base = resolveStaticSeoBase("terms", locale);
  return applySeoOverride(buildPageMetadata({ title: base.title, description: base.description, path: base.path }), base.path);
}

const COPY = {
  hi: {
    breadcrumbLegal: "कानूनी",
    breadcrumbTerms: "उपयोग की शर्तें",
    heading: "उपयोग की शर्तें",
    p1: "इस मंच का उपयोग करके, आप स्वचालित, थोक, या धोखाधड़ी वाली सर्वे प्रतिक्रियाएं सबमिट न करने, और प्रकाशित डेटा से व्यक्तिगत उत्तरदाताओं की पहचान करने का प्रयास न करने पर सहमत होते हैं।",
    p2: "इस साइट पर सामग्री — सर्वे परिणाम, उम्मीदवार सूचियां, और एनालिटिक्स — केवल सूचनात्मक उद्देश्यों के लिए प्रदान की जाती है और इसे आधिकारिक चुनाव परिणाम या निवेश, कानूनी, या वित्तीय सलाह के रूप में नहीं लिया जाना चाहिए।",
    p3Before: "उम्मीदवार जानकारी सार्वजनिक रिकॉर्ड और प्रतिष्ठित रिपोर्टिंग से प्राप्त की जाती है; सूचित किए जाने पर हम त्रुटियों को तुरंत सुधारते हैं। किसी सूचीबद्ध उम्मीदवार के बारे में गलत जानकारी की रिपोर्ट करने के लिए ",
    p3Link: "हमसे संपर्क करें",
    p3After: "।",
  },
  en: {
    breadcrumbLegal: "Legal",
    breadcrumbTerms: "Terms of Use",
    heading: "Terms of Use",
    p1: "By using this platform, you agree not to submit automated, bulk, or fraudulent survey responses, and not to attempt to identify individual respondents from published data.",
    p2: "Content on this site — survey results, candidate listings, and analytics — is provided for informational purposes only and should not be relied upon as an official election result or as investment, legal, or financial advice.",
    p3Before: "Candidate information is sourced from public records and reputable reporting; we correct errors promptly when notified. ",
    p3Link: "Contact us",
    p3After: " to report inaccurate information about a listed candidate.",
  },
};

export default async function TermsPage() {
  const locale = await getServerLocale();
  const c = COPY[locale];
  return (
    <Container className="max-w-3xl py-14">
      <Breadcrumb items={[{ label: c.breadcrumbLegal }, { label: c.breadcrumbTerms }]} />
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">{c.breadcrumbLegal}</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{c.heading}</h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p>{c.p1}</p>
        <p>{c.p2}</p>
        <p>
          {c.p3Before}
          <Link href="/contact" className="font-semibold text-accent hover:underline">
            {c.p3Link}
          </Link>
          {c.p3After}
        </p>
      </div>
    </Container>
  );
}
