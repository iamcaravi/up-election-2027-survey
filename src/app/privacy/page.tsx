import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Users, ChartColumn, Share2, Trash, Cookie, Lock, MessageCircle, ArrowRight, FileText, Ban } from "lucide-react";
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
  const base = resolveStaticSeoBase("privacy", locale);
  return applySeoOverride(buildPageMetadata({ title: base.title, description: base.description, path: base.path }), base.path);
}

const COPY = {
  hi: {
    breadcrumb: "गोपनीयता नीति",
    eyebrow: "गोपनीयता नीति",
    heading: "आपकी गोपनीयता हमारे लिए महत्वपूर्ण है",
    description:
      "VoterSurvey.in पर हम आपके व्यक्तिगत डेटा और गोपनीयता की सुरक्षा को गंभीरता से लेते हैं। यह पेज बताता है कि हम कौन-सी जानकारी एकत्र करते हैं, उसका उपयोग कैसे करते हैं और हम आपकी जानकारी की सुरक्षा के लिए क्या कदम उठाते हैं।",
    heroCardTitle: "हम आपकी जानकारी सुरक्षित रखते हैं",
    heroCardBody: "हम आपकी व्यक्तिगत जानकारी को सुरक्षित, गोपनीय और जिम्मेदारीपूर्वक उपयोग करने के लिए प्रतिबद्ध हैं।",
    cards: [
      { title: "हम कौन-सी जानकारी एकत्र करते हैं?", body: "हम किस प्रकार की जानकारी एकत्र करते हैं और वह जानकारी आप द्वारा किस माध्यम से प्रदान की जाती है।" },
      { title: "जानकारी का उपयोग", body: "एकत्रित की गई जानकारी का उपयोग केवल सर्वेक्षण, परिणाम और विश्लेषण प्रदान करने के लिए किया जाता है।" },
      { title: "जानकारी साझा करना", body: "हम आपकी व्यक्तिगत जानकारी को किसी तीसरे पक्ष के साथ कब और किन परिस्थितियों में साझा करते हैं।" },
      { title: "डेटा सुरक्षा", body: "हम आपकी जानकारी को अनधिकृत पहुंच, दुरुपयोग या परिवर्तन से बचाने के लिए उचित सुरक्षा उपाय अपनाते हैं।" },
      { title: "डेटा हटाना", body: "यदि आप अपनी जानकारी हटाना चाहते हैं, तो आप हमसे संपर्क कर सकते हैं और हम उचित प्रक्रिया अपनाएंगे।" },
      { title: "कुकीज़ (Cookies)", body: "हम कुकीज़ और समान तकनीकों का उपयोग आपके अनुभव को बेहतर बनाने के लिए करते हैं।" },
    ],
    detailedHeading: "विस्तृत जानकारी",
    detailedSubtitle: "नीचे हमारी गोपनीयता नीति के प्रमुख बिंदुओं की विस्तृत जानकारी दी गई है। कृपया इसे ध्यानपूर्वक पढ़ें ताकि आप समझ सकें कि आपकी जानकारी का कैसे उपयोग किया जाता है।",
    expandAll: "सभी खोलें",
    sections: [
      {
        title: "हम कौन-सी जानकारी एकत्र करते हैं?",
        body: "इस मंच पर सर्वे में भाग लेने के लिए किसी खाते की आवश्यकता नहीं है। हम आपका नाम, फोन नंबर, ईमेल पता, वोटर ID, आधार नंबर, सटीक पता, GPS स्थान, या मतदान केंद्र नहीं मांगते या संग्रहीत नहीं करते। प्रत्येक प्रतिक्रिया केवल जिस विधानसभा क्षेत्र सर्वे में सबमिट की गई, आपके उत्तर, और डुप्लिकेट-पहचान के लिए दो साल्टेड वन-वे हैश से जुड़ी होती है।",
      },
      {
        title: "जानकारी का उपयोग कैसे करते हैं?",
        body: "जनसांख्यिकीय उत्तर (आयु वर्ग, लिंग, सामाजिक श्रेणी, धर्म) वैकल्पिक हैं, और हर फ़ील्ड को छोड़ा जा सकता है। इनका उपयोग केवल अनाम, समग्र विश्लेषण की गणना के लिए किया जाता है, और इन्हें कभी भी व्यक्तिगत-प्रतिक्रिया स्तर पर प्रकाशित या निर्यात नहीं किया जाता। न्यूनतम निर्धारित प्रतिक्रिया संख्या से कम वाले किसी भी समूह को सार्वजनिक प्रदर्शन से रोका जाता है।",
      },
      {
        title: "जानकारी साझा करना",
        body: "हम व्यक्तिगत राजनीतिक प्रोफ़ाइल नहीं बनाते, और हम प्रतिक्रिया डेटा को तीसरे पक्षों के साथ बेचते या साझा नहीं करते।",
      },
      {
        title: "कुकीज़ का उपयोग",
        body: "यह वेबसाइट आपकी भाषा वरीयता (हिंदी/English) याद रखने के लिए एक आवश्यक कुकी का उपयोग करती है। हम किसी तृतीय-पक्ष विज्ञापन या ट्रैकिंग कुकीज़ का उपयोग नहीं करते।",
      },
      {
        title: "डेटा सुरक्षा",
        body: "आपके IP पते और डिवाइस पहचानकर्ता को साल्टेड वन-वे हैश के रूप में संग्रहीत किया जाता है, जिन्हें उलटकर मूल जानकारी प्राप्त नहीं की जा सकती। ये हैश केवल डुप्लिकेट या दुरुपयोगी सबमिशन का पता लगाने के लिए उपयोग किए जाते हैं।",
      },
      {
        title: "आपकी सहमति",
        body: "सर्वेक्षण में भाग लेना पूरी तरह स्वैच्छिक है। सर्वे में भाग लेकर, आप इस गोपनीयता नीति के अनुसार जानकारी के उपयोग हेतु सहमति देते हैं।",
      },
      {
        title: "इस नीति में परिवर्तन",
        body: "हम समय-समय पर इस नीति को अपडेट कर सकते हैं। किसी भी महत्वपूर्ण बदलाव की स्थिति में हम इस पृष्ठ पर सूचना अपडेट करेंगे।",
      },
      {
        title: "हमसे संपर्क करें",
        body: "गोपनीयता से जुड़े किसी भी प्रश्न, चिंता या अनुरोध के लिए आप हमसे संपर्क कर सकते हैं।",
        linkBefore: "",
        linkLabel: "हमसे संपर्क करें",
        linkAfter: "।",
      },
    ],
    sidebarCommitmentTitle: "हमारी प्रतिबद्धता",
    sidebarCommitmentBody: "आपकी गोपनीयता की सुरक्षा हमारी प्राथमिकता है। हम हमेशा पारदर्शी, जिम्मेदार और सुरक्षित डेटा प्रथाओं का पालन करते हैं।",
    sidebarQuestionTitle: "कोई प्रश्न है?",
    sidebarQuestionBody: "यदि आपको हमारी गोपनीयता नीति से संबंधित कोई प्रश्न या चिंता है, तो कृपया हमसे संपर्क करें।",
    sidebarQuestionCta: "संपर्क करें",
    relatedPagesTitle: "संबंधित पेज",
    relatedPages: [
      { label: "उपयोग की शर्तें", href: "/terms", icon: FileText },
      { label: "अस्वीकरण", href: "/disclaimer", icon: Ban },
      { label: "संपर्क करें", href: "/contact", icon: MessageCircle },
    ],
  },
  en: {
    breadcrumb: "Privacy Policy",
    eyebrow: "Privacy Policy",
    heading: "Your Privacy Matters to Us",
    description:
      "At VoterSurvey.in, we take the protection of your personal data and privacy seriously. This page explains what information we collect, how we use it, and the steps we take to protect your information.",
    heroCardTitle: "We Keep Your Information Safe",
    heroCardBody: "We are committed to using your personal information securely, confidentially, and responsibly.",
    cards: [
      { title: "What Information We Collect", body: "What kind of information we collect and how you provide it to us." },
      { title: "Use of Information", body: "Collected information is used only to provide surveys, results, and analysis." },
      { title: "Sharing Information", body: "When and under what circumstances we share your personal information with a third party." },
      { title: "Data Security", body: "We take appropriate security measures to protect your information from unauthorized access, misuse, or alteration." },
      { title: "Deleting Data", body: "If you want your information deleted, you can contact us and we will follow the appropriate process." },
      { title: "Cookies", body: "We use cookies and similar technologies to improve your experience." },
    ],
    detailedHeading: "Detailed Information",
    detailedSubtitle: "Below is detailed information on the key points of our privacy policy. Please read it carefully to understand how your information is used.",
    expandAll: "Expand All",
    sections: [
      {
        title: "What Information We Collect",
        body: "Taking a survey on this platform does not require an account. We do not ask for or store your name, phone number, email address, voter ID, Aadhaar number, exact address, GPS location, or polling booth. Each response is linked only to the constituency survey it was submitted to, your answers, and two salted one-way hashes used for duplicate detection.",
      },
      {
        title: "How We Use Information",
        body: "Demographic answers (age group, gender, social category, religion) are optional, and every field can be skipped. They are used only to compute anonymous, aggregate breakdowns, and are never published or exported at the individual-response level. Any group with fewer than the configured minimum number of responses is withheld from public display.",
      },
      {
        title: "Sharing Information",
        body: "We do not build individual political profiles, and we do not sell or share response data with third parties.",
      },
      {
        title: "Use of Cookies",
        body: "This website uses one essential cookie to remember your language preference (Hindi/English). We do not use any third-party advertising or tracking cookies.",
      },
      {
        title: "Data Security",
        body: "Your IP address and device identifier are stored as salted one-way hashes, which cannot be reversed to recover the original information. These hashes are used solely to detect duplicate or abusive submissions.",
      },
      {
        title: "Your Consent",
        body: "Taking the survey is entirely voluntary. By taking part in the survey, you consent to the use of information as described in this privacy policy.",
      },
      {
        title: "Changes to This Policy",
        body: "We may update this policy from time to time. We will update the notice on this page if there are any significant changes.",
      },
      {
        title: "Contact Us",
        body: "For any questions, concerns, or requests relating to privacy, you can get in touch with us.",
        linkBefore: "",
        linkLabel: "Contact us",
        linkAfter: ".",
      },
    ],
    sidebarCommitmentTitle: "Our Commitment",
    sidebarCommitmentBody: "Protecting your privacy is our priority. We always follow transparent, responsible, and secure data practices.",
    sidebarQuestionTitle: "Have a Question?",
    sidebarQuestionBody: "If you have any question or concern about our privacy policy, please get in touch with us.",
    sidebarQuestionCta: "Contact Us",
    relatedPagesTitle: "Related Pages",
    relatedPages: [
      { label: "Terms of Use", href: "/terms", icon: FileText },
      { label: "Disclaimer", href: "/disclaimer", icon: Ban },
      { label: "Contact Us", href: "/contact", icon: MessageCircle },
    ],
  },
} satisfies Record<Locale, unknown>;

const FEATURE_ICONS = [Users, ChartColumn, Share2, ShieldCheck, Trash, Cookie] as const;
const FEATURE_COLORS = [
  "bg-blue-50 text-blue-600",
  "bg-green-50 text-green-600",
  "bg-purple-50 text-purple-600",
  "bg-orange-50 text-orange-600",
  "bg-rose-50 text-rose-600",
  "bg-green-50 text-green-600",
] as const;

export default async function PrivacyPage() {
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
            <ShieldCheck size={20} />
          </div>
          <h2 className="mt-3 font-display text-base font-bold text-ink">{c.heroCardTitle}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{c.heroCardBody}</p>
        </div>
      </section>

      {/* Feature card grid */}
      <section className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
        {c.cards.map((card, i) => {
          const Icon = FEATURE_ICONS[i];
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

      {/* Detailed info + sidebar */}
      <section className="mt-10 sm:mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">{c.detailedHeading}</h2>
            <p className="mt-1 max-w-xl text-sm text-muted">{c.detailedSubtitle}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <LegalAccordion sections={c.sections} expandAllLabel={c.expandAll} contactLabel={c.sidebarQuestionCta} />

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-green-50/60 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <Lock size={17} />
              </span>
              <p className="mt-2.5 font-display text-sm font-bold text-ink">{c.sidebarCommitmentTitle}</p>
              <p className="mt-1 text-xs leading-relaxed text-foreground/80">{c.sidebarCommitmentBody}</p>
            </div>

            <div className="rounded-2xl border border-border bg-blue-50/60 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
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

            <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
              <p className="font-display text-sm font-bold text-ink">{c.relatedPagesTitle}</p>
              <div className="mt-2.5 space-y-1.5">
                {c.relatedPages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <Link
                      key={page.href}
                      href={page.href}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground/85 transition-colors hover:bg-surface-2"
                    >
                      <Icon size={15} className="text-accent" />
                      {page.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Container>
  );
}
