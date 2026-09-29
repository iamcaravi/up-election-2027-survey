import type { Metadata } from "next";
import Link from "next/link";
import { FileText, CircleCheck, Ban, Copyright, TriangleAlert, Settings, Scale, MessageCircle, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LegalAccordion } from "@/components/legal/LegalAccordion";
import { buildPageMetadata } from "@/lib/seo";
import { resolveStaticSeoBase } from "@/lib/seo-catalog";
import { applySeoOverride } from "@/lib/seo-overrides";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import type { Locale } from "@/lib/i18n/LocaleProvider";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const base = resolveStaticSeoBase("terms", locale);
  return applySeoOverride(buildPageMetadata({ title: base.title, description: base.description, path: base.path }), base.path);
}

const COPY = {
  hi: {
    breadcrumb: "उपयोग की शर्तें",
    eyebrow: "उपयोग की शर्तें",
    heading: "VoterSurvey.in का उपयोग करते समय मान्य शर्तें",
    description:
      "इन उपयोग की शर्तों (Terms of Use) में VoterSurvey.in वेबसाइट और हमारी सेवाओं के उपयोग से संबंधित नियम और शर्तें दी गई हैं। हमारी वेबसाइट का उपयोग करके, आप इन शर्तों से सहमत होते हैं।",
    heroCardTitle: "कृपया ध्यानपूर्वक पढ़ें",
    heroCardBody:
      "VoterSurvey.in का उपयोग करने से पहले इन शर्तों को ध्यानपूर्वक पढ़ें। यह हमारे प्लेटफ़ॉर्म के सुरक्षित, जिम्मेदार और सही उपयोग को सुनिश्चित करने के लिए आवश्यक है।",
    cards: [
      { title: "सेवा का उद्देश्य", body: "यह प्लेटफ़ॉर्म केवल जनमत सर्वेक्षण, राजनीतिक जानकारी और शैक्षणिक विश्लेषण के लिए है।" },
      { title: "स्वीकार्य उपयोग", body: "आप इस वेबसाइट का उपयोग केवल वैध, उचित और गैर-हानिकारक उद्देश्यों के लिए करेंगे।" },
      { title: "प्रतिबंधित गतिविधियां", body: "किसी भी प्रकार की गलत, भ्रामक, अवैध या हानिकारक गतिविधि प्रतिबंधित है।" },
      { title: "बौद्धिक संपदा अधिकार", body: "इस वेबसाइट की संपूर्ण सामग्री VoterSurvey.in की संपत्ति है। बिना अनुमति उपयोग नहीं की जा सकती।" },
      { title: "सटीकता की सीमा", body: "यह जानकारी सामान्य स्रोतों पर आधारित है। हम 100% सटीकता की गारंटी नहीं देते।" },
      { title: "शर्तों में परिवर्तन", body: "हम किसी भी समय इन शर्तों को अपडेट कर सकते हैं। जारी उपयोग का अर्थ संशोधित शर्तों की स्वीकृति है।" },
    ],
    detailedHeading: "विस्तृत शर्तें",
    detailedSubtitle: "नीचे VoterSurvey.in के उपयोग से संबंधित विस्तृत शर्तें दी गई हैं।",
    expandAll: "सभी देखें",
    sections: [
      {
        title: "सेवा का उद्देश्य",
        body: "यह प्लेटफ़ॉर्म केवल जनमत सर्वेक्षण, राजनीतिक जानकारी और शैक्षणिक विश्लेषण के लिए है। इस पर उपलब्ध सामग्री — सर्वे परिणाम, उम्मीदवार सूचियां और विश्लेषण — केवल सूचनात्मक उद्देश्यों के लिए है और इसे आधिकारिक चुनाव परिणाम या निवेश, कानूनी अथवा वित्तीय सलाह के रूप में नहीं लिया जाना चाहिए।",
      },
      {
        title: "उपयोग की पात्रता",
        body: "यह सर्वेक्षण किसी भी व्यक्ति के लिए खुला है जो अपनी राय साझा करना चाहता है। यह मंच मतदाता पात्रता, आयु या निवास की पुष्टि नहीं करता, इसलिए इसे केवल पुष्ट मतदाताओं के सर्वे के रूप में नहीं माना जाना चाहिए।",
      },
      {
        title: "स्वीकार्य उपयोग (Acceptable Use)",
        body: "इस मंच का उपयोग करके, आप स्वचालित, थोक, या धोखाधड़ी वाली सर्वे प्रतिक्रियाएं सबमिट न करने पर सहमत होते हैं।",
      },
      {
        title: "प्रतिबंधित गतिविधियां",
        body: "आप प्रकाशित डेटा से व्यक्तिगत उत्तरदाताओं की पहचान करने का प्रयास न करने, वेबसाइट की सुरक्षा या सामान्य संचालन को बाधित न करने, और किसी भी गैर-कानूनी उद्देश्य के लिए मंच का उपयोग न करने पर सहमत होते हैं।",
      },
      {
        title: "बौद्धिक संपदा अधिकार (Intellectual Property)",
        body: "इस वेबसाइट पर उपलब्ध डिज़ाइन, लेआउट और मूल सामग्री VoterSurvey.in से संबंधित है। उम्मीदवार जानकारी और तस्वीरें सार्वजनिक रिकॉर्ड व स्रोत-उद्धृत रिपोर्टिंग से ली जाती हैं — विस्तार के लिए हमारी विधि/Methodology देखें।",
      },
      {
        title: "तृतीय पक्ष लिंक",
        body: "यह मंच कभी-कभी बाहरी वेबसाइटों (जैसे भारत निर्वाचन आयोग, eci.gov.in) के लिंक शामिल कर सकता है। इन बाहरी साइटों की सामग्री और गोपनीयता प्रथाओं के लिए हम ज़िम्मेदार नहीं हैं।",
      },
      {
        title: "जानकारी की सटीकता",
        body: "उम्मीदवार जानकारी सार्वजनिक रिकॉर्ड और प्रतिष्ठित रिपोर्टिंग से प्राप्त की जाती है; सूचित किए जाने पर हम त्रुटियों को तुरंत सुधारते हैं।",
        linkBefore: "किसी सूचीबद्ध उम्मीदवार के बारे में गलत जानकारी की रिपोर्ट करने के लिए ",
        linkLabel: "हमसे संपर्क करें",
        linkAfter: "।",
      },
      {
        title: "दायित्व की सीमा",
        body: "VoterSurvey.in पर उपलब्ध जानकारी सामान्य स्रोतों पर आधारित है। हम इस जानकारी के उपयोग से उत्पन्न किसी भी हानि या नुकसान के लिए ज़िम्मेदार नहीं होंगे।",
      },
      {
        title: "शर्तों में परिवर्तन",
        body: "हम किसी भी समय इन शर्तों को अपडेट कर सकते हैं। इन परिवर्तनों के बाद वेबसाइट का निरंतर उपयोग संशोधित शर्तों की स्वीकृति माना जाएगा।",
      },
    ],
    sidebarLegalTitle: "कानूनी अनुपालन",
    sidebarLegalBody: "आप इस वेबसाइट का उपयोग और सभी लागू भारतीय कानूनों और नियमों के अनुसार करेंगे।",
    sidebarAbuseTitle: "दुरुपयोग पर कार्रवाई",
    sidebarAbuseBody: "इन शर्तों का उल्लंघन करने पर हम आपके एक्सेस को सीमित या समाप्त कर सकते हैं।",
    sidebarQuestionTitle: "कोई प्रश्न है?",
    sidebarQuestionBody: "यदि आपको इन शर्तों के बारे में कोई प्रश्न है, तो कृपया हमसे संपर्क करें।",
    sidebarQuestionCta: "संपर्क करें",
  },
  en: {
    breadcrumb: "Terms of Use",
    eyebrow: "Terms of Use",
    heading: "Terms Applicable While Using VoterSurvey.in",
    description:
      "These Terms of Use set out the rules and conditions governing the use of the VoterSurvey.in website and our services. By using our website, you agree to these terms.",
    heroCardTitle: "Please Read Carefully",
    heroCardBody:
      "Please read these terms carefully before using VoterSurvey.in. This helps ensure safe, responsible, and correct use of our platform.",
    cards: [
      { title: "Purpose of Service", body: "This platform is only for public-opinion surveys, political information, and educational analysis." },
      { title: "Acceptable Use", body: "You will use this website only for lawful, appropriate, and non-harmful purposes." },
      { title: "Restricted Activities", body: "Any kind of false, misleading, unlawful, or harmful activity is prohibited." },
      { title: "Intellectual Property Rights", body: "All content on this website is the property of VoterSurvey.in. It may not be used without permission." },
      { title: "Accuracy Limits", body: "This information is based on general sources. We do not guarantee 100% accuracy." },
      { title: "Changes to Terms", body: "We may update these terms at any time. Continued use means acceptance of the revised terms." },
    ],
    detailedHeading: "Detailed Terms",
    detailedSubtitle: "Below are the detailed terms governing the use of VoterSurvey.in.",
    expandAll: "Expand All",
    sections: [
      {
        title: "Purpose of Service",
        body: "This platform is only for public-opinion surveys, political information, and educational analysis. Content on this site — survey results, candidate listings, and analytics — is provided for informational purposes only and should not be relied upon as an official election result or as investment, legal, or financial advice.",
      },
      {
        title: "Eligibility",
        body: "This survey is open to anyone who wants to share an opinion. This platform does not verify voter eligibility, age, or residency, so it should not be read as a survey of confirmed voters only.",
      },
      {
        title: "Acceptable Use",
        body: "By using this platform, you agree not to submit automated, bulk, or fraudulent survey responses.",
      },
      {
        title: "Restricted Activities",
        body: "You agree not to attempt to identify individual respondents from published data, not to disrupt the website's security or normal operation, and not to use the platform for any unlawful purpose.",
      },
      {
        title: "Intellectual Property",
        body: "The design, layout, and original content available on this website belong to VoterSurvey.in. Candidate information and photographs are sourced from public records and source-cited reporting — see our Methodology page for details.",
      },
      {
        title: "Third-Party Links",
        body: "This platform may occasionally include links to external websites (such as the Election Commission of India, eci.gov.in). We are not responsible for the content or privacy practices of those external sites.",
      },
      {
        title: "Accuracy of Information",
        body: "Candidate information is sourced from public records and reputable reporting; we correct errors promptly when notified.",
        linkBefore: "",
        linkLabel: "Contact us",
        linkAfter: " to report inaccurate information about a listed candidate.",
      },
      {
        title: "Limitation of Liability",
        body: "Information available on VoterSurvey.in is based on general sources. We will not be liable for any loss or damage arising from the use of this information.",
      },
      {
        title: "Changes to Terms",
        body: "We may update these terms at any time. Continued use of the website after such changes will be treated as acceptance of the revised terms.",
      },
    ],
    sidebarLegalTitle: "Legal Compliance",
    sidebarLegalBody: "You will use this website in accordance with all applicable Indian laws and regulations.",
    sidebarAbuseTitle: "Action on Misuse",
    sidebarAbuseBody: "We may limit or terminate your access if you violate these terms.",
    sidebarQuestionTitle: "Have a Question?",
    sidebarQuestionBody: "If you have any questions about these terms, please get in touch with us.",
    sidebarQuestionCta: "Contact Us",
  },
} satisfies Record<Locale, unknown>;

const FEATURE_COLORS = [
  "bg-green-50 text-green-600",
  "bg-blue-50 text-blue-600",
  "bg-orange-50 text-orange-600",
  "bg-purple-50 text-purple-600",
  "bg-rose-50 text-rose-600",
  "bg-green-50 text-green-600",
] as const;
const FEATURE_ICON_LIST = [Scale, CircleCheck, Ban, Copyright, TriangleAlert, Settings] as const;

export default async function TermsPage() {
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
        </div>

        <div className="rounded-2xl border border-border bg-blue-50/60 p-5 shadow-[var(--shadow-card)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <FileText size={20} />
          </div>
          <h2 className="mt-3 font-display text-base font-bold text-ink">{c.heroCardTitle}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{c.heroCardBody}</p>
        </div>
      </section>

      {/* Feature card grid */}
      <section className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
        {c.cards.map((card, i) => {
          const Icon = FEATURE_ICON_LIST[i];
          return (
            <div key={card.title} className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${FEATURE_COLORS[i]}`}>
                <Icon size={19} />
              </span>
              <h3 className="mt-3 font-display text-sm font-bold text-ink">{card.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{card.body}</p>
            </div>
          );
        })}
      </section>

      {/* Detailed terms + sidebar */}
      <section className="mt-10 sm:mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">{c.detailedHeading}</h2>
            <p className="mt-1 text-sm text-muted">{c.detailedSubtitle}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <LegalAccordion sections={c.sections} expandAllLabel={c.expandAll} contactLabel={c.sidebarQuestionCta} />

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-blue-50/60 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Scale size={17} />
              </span>
              <p className="mt-2.5 font-display text-sm font-bold text-ink">{c.sidebarLegalTitle}</p>
              <p className="mt-1 text-xs leading-relaxed text-foreground/80">{c.sidebarLegalBody}</p>
            </div>

            <div className="rounded-2xl border border-border bg-orange-50/60 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <TriangleAlert size={17} />
              </span>
              <p className="mt-2.5 font-display text-sm font-bold text-ink">{c.sidebarAbuseTitle}</p>
              <p className="mt-1 text-xs leading-relaxed text-foreground/80">{c.sidebarAbuseBody}</p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <MessageCircle size={17} />
              </span>
              <p className="mt-2.5 font-display text-sm font-bold text-ink">{c.sidebarQuestionTitle}</p>
              <p className="mt-1 text-xs leading-relaxed text-foreground/80">{c.sidebarQuestionBody}</p>
              <Link
                href="/contact"
                className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-orange-600 px-4 text-xs font-bold text-white transition-colors hover:bg-orange-700"
              >
                {c.sidebarQuestionCta}
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Container>
  );
}
